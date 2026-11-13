import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';

export const TIPOS = ['escala', 'caritas', 'estrellas', 'unica', 'multiple', 'matriz', 'texto', 'seccion'] as const;
export type TipoPregunta = (typeof TIPOS)[number];

/** Caritas y estrellas: 5 niveles que valen 2, 4, 6, 8, 10 (equivalente a la escala 1-10). */
export const VALORES_5 = [2, 4, 6, 8, 10];
/** Matriz de satisfaccion: de "Muy satisfecho" (10) a "Muy insatisfecho" (2). */
export const COLUMNAS_MATRIZ = [
  { etiqueta: 'Muy satisfecho', valor: 10 },
  { etiqueta: 'Satisfecho', valor: 8 },
  { etiqueta: 'Neutral', valor: 6 },
  { etiqueta: 'Insatisfecho', valor: 4 },
  { etiqueta: 'Muy insatisfecho', valor: 2 },
];

export const CON_SEGUIMIENTO = ['escala', 'caritas', 'estrellas', 'unica'];
const CLAVES_SEG: Record<string, string[]> = {
  escala: ['bajo', 'medio', 'alto'],
  caritas: ['2', '4', '6', '8', '10'],
  estrellas: ['2', '4', '6', '8', '10'],
};
/** Clave de `seguimiento` que corresponde al valor elegido. */
export const claveSeg = (tipo: string, v: any, rangos?: { bajoHasta?: number; medioHasta?: number }) => {
  if (tipo === 'unica') return String(v ?? '').trim();
  if (tipo === 'escala') {
    const b = rangos?.bajoHasta ?? 6;
    const m = rangos?.medioHasta ?? 8;
    return Number(v) <= b ? 'bajo' : Number(v) <= m ? 'medio' : 'alto';
  }
  return String(v);
};
export const claveComentario = (id: string) => `${id}__c`;

/** Acepta enlaces http(s) y rutas relativas. */
const urlSegura = (v: any) => {
  const u = String(v ?? '').trim().slice(0, 600);
  return /^https?:\/\/\S+$/i.test(u) ? u : '';
};
/** Acepta URL http(s) o una imagen subida (data URL) de tamano razonable. */
const imagenSegura = (v: any) => {
  const u = String(v ?? '').trim();
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(u) && u.length <= 600_000) return u;
  return urlSegura(u);
};
export const esSeccion = (q: any) => q?.tipo === 'seccion';
export const ETIQUETAS_NIVEL = ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];

const txt = (v: any, max: number) => String(v ?? '').trim().slice(0, max);
const idSeguro = (v: any) => (typeof v === 'string' && /^[a-zA-Z0-9_-]{1,24}$/.test(v) ? String(v) : randomBytes(4).toString('hex'));

export function slugValido(s: string) {
  return /^[a-z0-9][a-z0-9-]{2,39}$/.test(s);
}
export function slugAleatorio() {
  return randomBytes(5).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, 'x').slice(0, 7);
}
export function normalizarSlug(s: any) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Limpia y valida la configuracion de una encuesta que llega del creador. */
export function sanitizarEncuesta(b: any) {
  const titulo = txt(b?.titulo, 120);
  if (!titulo) throw new BadRequestException('La encuesta necesita un título');
  if (!Array.isArray(b?.preguntas) || !b.preguntas.some((p: any) => p?.tipo !== 'seccion')) throw new BadRequestException('Agrega al menos una pregunta');
  if (b.preguntas.length > 80) throw new BadRequestException('Máximo 80 elementos (preguntas y secciones)');

  const ids = new Set<string>();
  const unico = (v: any) => {
    let id = idSeguro(v);
    while (ids.has(id)) id = randomBytes(4).toString('hex');
    ids.add(id);
    return id;
  };

  const preguntas = b.preguntas.map((p: any, i: number) => {
    if (!TIPOS.includes(p?.tipo)) throw new BadRequestException(`Pregunta ${i + 1}: tipo inválido`);
    if (p.tipo === 'seccion') {
      const sec: any = { id: unico(p.id), tipo: 'seccion', texto: '', obligatoria: false };
      const titulo = txt(p.titulo, 200);
      const descripcion = txt(p.descripcion, 1500);
      const imagen = imagenSegura(p.imagen);
      const enlace = urlSegura(p.enlace);
      if (!titulo && !descripcion && !imagen && !enlace) throw new BadRequestException(`Elemento ${i + 1}: la sección está vacía`);
      if (titulo) sec.titulo = titulo;
      if (descripcion) sec.descripcion = descripcion;
      if (imagen) sec.imagen = imagen;
      if (enlace) {
        sec.enlace = enlace;
        sec.enlaceTexto = txt(p.enlaceTexto, 80);
      }
      return sec;
    }
    const q: any = { id: unico(p.id), tipo: p.tipo, texto: txt(p.texto, 300), obligatoria: !!p.obligatoria };
    if (!q.texto) throw new BadRequestException(`Pregunta ${i + 1}: escribe el texto`);
    const tituloP = txt(p.titulo, 120);
    if (tituloP) q.titulo = tituloP;
    if (p.tipo === 'texto') {
      const ph = txt(p.placeholder, 120);
      if (ph) q.placeholder = ph;
    }
    if (p.tipo === 'unica' || p.tipo === 'multiple') {
      q.opciones = (Array.isArray(p.opciones) ? p.opciones : []).map((o: any) => txt(o, 120)).filter(Boolean).slice(0, 30);
      if (q.opciones.length < 2) throw new BadRequestException(`Pregunta ${i + 1}: agrega al menos 2 opciones`);
    }
    if (CON_SEGUIMIENTO.includes(p.tipo) && p.seguimiento && typeof p.seguimiento === 'object') {
      const seg: Record<string, any> = {};
      const clavesValidas = p.tipo === 'unica' ? (q.opciones || []) : CLAVES_SEG[p.tipo] || [];
      for (const k of clavesValidas) {
        const s = p.seguimiento[k];
        const mensaje = txt(s?.mensaje, 200);
        const comentario = !!s?.comentario;
        if (mensaje || comentario) {
          const item: any = { mensaje, comentario };
          if (comentario) {
            if (s?.comentarioObligatorio) item.comentarioObligatorio = true;
            const ph = txt(s?.placeholder, 120);
            if (ph) item.placeholder = ph;
          }
          seg[k] = item;
        }
      }
      if (Object.keys(seg).length) q.seguimiento = seg;
    }
    if (p.tipo === 'escala' && p.rangosEscala && typeof p.rangosEscala === 'object') {
      const b = Math.round(Number(p.rangosEscala.bajoHasta));
      const m = Math.round(Number(p.rangosEscala.medioHasta));
      if (!isNaN(b) && !isNaN(m) && b >= 1 && b <= 8 && m > b && m <= 9) {
        q.rangosEscala = { bajoHasta: b, medioHasta: m };
      }
    }
    if (p.tipo === 'matriz') {
      q.filas = (Array.isArray(p.filas) ? p.filas : []).map((o: any) => txt(o, 120)).filter(Boolean).slice(0, 15);
      if (q.filas.length < 1) throw new BadRequestException(`Pregunta ${i + 1}: agrega al menos 1 fila`);
      if (Array.isArray(p.columnas)) {
        const cols = COLUMNAS_MATRIZ.map((c, k) => txt(p.columnas[k], 40) || c.etiqueta);
        if (cols.some((c, k) => c !== COLUMNAS_MATRIZ[k].etiqueta)) q.columnas = cols;
      }
    }
    return q;
  });

  const camposIds = new Set<string>();
  const camposCliente = (Array.isArray(b?.camposCliente) ? b.camposCliente : []).slice(0, 10).map((c: any) => {
    let id = idSeguro(c.id);
    while (camposIds.has(id)) id = randomBytes(4).toString('hex');
    camposIds.add(id);
    const etiqueta = txt(c.etiqueta, 60);
    if (!etiqueta) throw new BadRequestException('Un campo del cliente no tiene nombre');
    return { id, etiqueta, tipo: ['texto', 'email', 'telefono'].includes(c.tipo) ? c.tipo : 'texto', obligatorio: !!c.obligatorio };
  });

  const c = b?.configuracion && typeof b.configuracion === 'object' ? b.configuracion : {};
  const configuracion = {
    avisarAdmin: !!c.avisarAdmin,
    confirmarCliente: !!c.confirmarCliente && camposCliente.some((x: any) => x.tipo === 'email'),
    campoCorreoId: camposCliente.some((x: any) => x.id === c.campoCorreoId && x.tipo === 'email') ? c.campoCorreoId : undefined,
    asuntoCliente: txt(c.asuntoCliente, 150),
    mensajeCliente: txt(c.mensajeCliente, 1500),
  };

  let fechaLimite: string | null = null;
  if (b?.fechaLimite) {
    const d = new Date(b.fechaLimite);
    if (isNaN(+d)) throw new BadRequestException('Fecha límite inválida');
    fechaLimite = d.toISOString();
  }
  const max = Number(b?.maxRespuestas);

  let tema: any = undefined;
  if (b?.tema && typeof b.tema === 'object') {
    const colorPrimario = typeof b.tema.colorPrimario === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(b.tema.colorPrimario)
      ? b.tema.colorPrimario
      : '#2563eb';
    const fondosValidos = ['degradado', 'burbujas', 'ondas', 'puntos', 'lineas', 'aurora', 'claro', 'oscuro', 'calido', 'menta'];
    const fondo = fondosValidos.includes(b.tema.fondo) ? b.tema.fondo : 'degradado';
    const bordesValidos = ['redondeado', 'suave', 'recto'];
    const estiloBordes = bordesValidos.includes(b.tema.estiloBordes) ? b.tema.estiloBordes : 'redondeado';
    const tarjetasValidas = ['solido', 'vidrio', 'plano'];
    const estiloTarjeta = tarjetasValidas.includes(b.tema.estiloTarjeta) ? b.tema.estiloTarjeta : 'solido';
    const mostrarLogo = b.tema.mostrarLogo !== false;
    tema = { colorPrimario, fondo, estiloBordes, estiloTarjeta, mostrarLogo };
  }

  return {
    titulo,
    datos: {
      descripcion: txt(b?.descripcion, 600),
      mensajeFinal: txt(b?.mensajeFinal, 300) || '¡Gracias por tu opinión!',
      preguntas,
      camposCliente,
      configuracion,
      fechaLimite,
      maxRespuestas: Number.isFinite(max) && max > 0 ? Math.floor(max) : null,
      ...(tema ? { tema } : {}),
    },
  };
}

/** Valida las respuestas de un cliente contra la configuracion de la encuesta. */
export function validarRespuesta(enc: any, body: any) {
  const entrada = body?.respuestas && typeof body.respuestas === 'object' ? body.respuestas : {};
  const resp: Record<string, any> = {};

  for (const q of enc.preguntas) {
    if (esSeccion(q)) continue;
    const v = entrada[q.id];
    const vacio = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) ||
      (q.tipo === 'matriz' && (!v || typeof v !== 'object' || Object.keys(v).length === 0));
    if (vacio) {
      if (q.obligatoria) throw new BadRequestException(`Falta responder: "${q.texto}"`);
      continue;
    }
    const mal = () => new BadRequestException(`Respuesta inválida en: "${q.texto}"`);
    switch (q.tipo as TipoPregunta) {
      case 'escala': {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 10) throw mal();
        resp[q.id] = n;
        break;
      }
      case 'caritas':
      case 'estrellas': {
        const n = Number(v);
        if (!VALORES_5.includes(n)) throw mal();
        resp[q.id] = n;
        break;
      }
      case 'unica':
        if (!q.opciones.includes(v)) throw mal();
        resp[q.id] = v;
        break;
      case 'multiple': {
        if (!Array.isArray(v) || v.some((x) => !q.opciones.includes(x))) throw mal();
        resp[q.id] = [...new Set(v)];
        break;
      }
      case 'matriz': {
        const out: Record<string, number> = {};
        for (const fila of q.filas) {
          const n = Number(v[fila]);
          if (v[fila] === undefined) {
            if (q.obligatoria) throw new BadRequestException(`Falta una fila en: "${q.texto}"`);
            continue;
          }
          if (!VALORES_5.includes(n)) throw mal();
          out[fila] = n;
        }
        resp[q.id] = out;
        break;
      }
      case 'texto':
        resp[q.id] = txt(v, 2000);
        break;
    }
    // comentario de seguimiento (solo si el mensaje elegido lo pide)
    if (CON_SEGUIMIENTO.includes(q.tipo) && q.seguimiento) {
      const seg = q.seguimiento[claveSeg(q.tipo, resp[q.id], q.rangosEscala)];
      const c = txt(entrada[claveComentario(q.id)], 1000);
      if (seg?.comentario && seg.comentarioObligatorio && !c) throw new BadRequestException(`Falta el comentario en: "${q.texto}"`);
      if (seg?.comentario && c) resp[claveComentario(q.id)] = c;
    }
  }

  const ent = body?.respondiente && typeof body.respondiente === 'object' ? body.respondiente : {};
  const respondiente: Record<string, string> = {};
  for (const c of enc.camposCliente) {
    const val = txt(ent[c.id], 200);
    if (!val) {
      if (c.obligatorio) throw new BadRequestException(`Falta completar: ${c.etiqueta}`);
      continue;
    }
    if (c.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) throw new BadRequestException(`${c.etiqueta} inválido`);
    respondiente[c.id] = val;
  }
  return { respuestas: resp, respondiente };
}

/** Estadisticas por pregunta para los graficos. */
export function calcularResumen(enc: any, filas: { datos: any }[]) {
  return enc.preguntas.filter((q: any) => !esSeccion(q)).map((q: any) => {
    const vals = filas.map((f) => f.datos?.respuestas?.[q.id]).filter((v) => v !== undefined);
    const base: any = { id: q.id, tipo: q.tipo, texto: q.texto, total: vals.length };
    const prom = (a: number[]) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : null);

    if (q.seguimiento) {
      base.comentarios = filas
        .map((f) => ({ valor: f.datos?.respuestas?.[q.id], texto: f.datos?.respuestas?.[claveComentario(q.id)] }))
        .filter((c) => c.texto)
        .slice(-50)
        .reverse();
    }

    if (q.tipo === 'escala' || q.tipo === 'caritas' || q.tipo === 'estrellas') {
      const niveles = q.tipo === 'escala' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : VALORES_5;
      base.promedio = prom(vals);
      base.distribucion = niveles.map((n) => ({ valor: n, cantidad: vals.filter((v) => v === n).length }));
      if (q.tipo === 'escala' && vals.length) {
        const b = q.rangosEscala?.bajoHasta ?? 6;
        const m = q.rangosEscala?.medioHasta ?? 8;
        const pro = vals.filter((v) => v >= m + 1).length;
        const det = vals.filter((v) => v <= b).length;
        base.indiceNeto = Math.round(((pro - det) / vals.length) * 100);
      }
    } else if (q.tipo === 'unica' || q.tipo === 'multiple') {
      const c: Record<string, number> = Object.fromEntries(q.opciones.map((o: string) => [o, 0]));
      vals.forEach((v) => (Array.isArray(v) ? v : [v]).forEach((o: string) => (c[o] = (c[o] || 0) + 1)));
      base.opciones = q.opciones.map((o: string) => ({ opcion: o, cantidad: c[o] }));
    } else if (q.tipo === 'matriz') {
      base.filas = q.filas.map((fila: string) => {
        const nums = vals.map((v) => v[fila]).filter((n) => n !== undefined);
        return {
          fila,
          total: nums.length,
          promedio: prom(nums),
          distribucion: COLUMNAS_MATRIZ.map((col, k) => ({ etiqueta: q.columnas?.[k] || col.etiqueta, valor: col.valor, cantidad: nums.filter((n) => n === col.valor).length })),
        };
      });
    } else {
      base.textos = vals.slice(-50).reverse();
    }
    return base;
  });
}
