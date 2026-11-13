import {
  Building2, CircleDot, Droplets, Grid3x3, Hash, Leaf, ListChecks, MessageSquareText, Moon, Palette,
  LayoutTemplate, SlidersHorizontal, SmilePlus, Sparkles, Star, Sun, Sunrise, Waves, type LucideIcon
} from 'lucide-react';
import type { NombreEmoji } from './emojis';

export type TipoPregunta = 'escala' | 'caritas' | 'estrellas' | 'unica' | 'multiple' | 'matriz' | 'texto' | 'seccion';

/** Mensaje opcional que aparece según lo que responda el cliente. */
export interface Seguimiento {
  mensaje: string;
  /** Si es true, además del mensaje se muestra una caja para que el cliente escriba. */
  comentario: boolean;
  /** Si es true, el cliente debe escribir el comentario para continuar. */
  comentarioObligatorio?: boolean;
  /** Texto de ayuda de la caja de comentario. */
  placeholder?: string;
}

export interface RangosEscala {
  bajoHasta: number;
  medioHasta: number;
}

export interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  texto: string;
  /** Título opcional que se muestra encima de la pregunta. */
  titulo?: string;
  obligatoria: boolean;
  /** Texto de ayuda de la caja (tipo texto libre). */
  placeholder?: string;
  /** Matriz: títulos de las 5 columnas, de "muy satisfecho" a "muy insatisfecho". */
  columnas?: string[];
  /** Sección: contenido opcional. */
  descripcion?: string;
  imagen?: string;
  enlace?: string;
  enlaceTexto?: string;
  opciones?: string[];
  filas?: string[];
  rangosEscala?: RangosEscala;
  /** Clave = valor (caritas/estrellas: "2","4","6","8","10") o grupo (escala: "bajo","medio","alto"). */
  seguimiento?: Record<string, Seguimiento>;
}
export interface Campo {
  id: string;
  etiqueta: string;
  tipo: 'texto' | 'email' | 'telefono';
  obligatorio: boolean;
}
export interface Configuracion {
  /** Avisar por correo al creador de la encuesta cuando alguien responde. */
  avisarAdmin: boolean;
  /** Enviar un correo de agradecimiento al cliente (requiere un dato de tipo correo). */
  confirmarCliente: boolean;
  campoCorreoId?: string;
  asuntoCliente?: string;
  mensajeCliente?: string;
}
export const ASUNTO_CLIENTE_DEFECTO = 'Gracias por responder nuestra encuesta';
export const MENSAJE_CLIENTE_DEFECTO = 'Hola {nombre},\n\nGracias por haber llenado la encuesta «{encuesta}». Tu opinión es muy valiosa y nos ayuda a mejorar cada día.';
export const ETIQUETA_GMAIL = 'Encuestas Vilaseca';

export type EstiloFondo = 'degradado' | 'burbujas' | 'ondas' | 'puntos' | 'lineas' | 'aurora' | 'claro' | 'oscuro' | 'calido' | 'menta';
export type EstiloBordes = 'redondeado' | 'suave' | 'recto';
export type EstiloTarjeta = 'solido' | 'vidrio' | 'plano';

export interface TemaEncuesta {
  colorPrimario?: string; // hex p.ej. #2563eb
  fondo?: EstiloFondo;
  estiloBordes?: EstiloBordes;
  estiloTarjeta?: EstiloTarjeta;
  mostrarLogo?: boolean;
}

export interface Encuesta {
  id?: string;
  slug?: string;
  titulo: string;
  descripcion: string;
  mensajeFinal: string;
  preguntas: Pregunta[];
  camposCliente: Campo[];
  configuracion?: Configuracion;
  fechaLimite: string | null;
  maxRespuestas: number | null;
  tema?: TemaEncuesta;
  activo?: boolean;
  respuestas?: number;
  creadoEn?: string;
}
export interface EncuestaPublica extends Omit<Encuesta, 'id' | 'slug' | 'maxRespuestas'> {
  estado: 'abierta' | 'pausada' | 'vencida' | 'completa';
}

export interface TemaPreset {
  id: string;
  nombre: string;
  Icono: LucideIcon;
  desc: string;
  colorPrimario: string;
  fondo: EstiloFondo;
  estiloBordes: EstiloBordes;
  estiloTarjeta: EstiloTarjeta;
}

export const TEMAS_PRESET: TemaPreset[] = [
  { id: 'vilaseca', nombre: 'Vilaseca Corporativo', Icono: Building2, desc: 'Azul insignia con degradado suave', colorPrimario: '#2563eb', fondo: 'degradado', estiloBordes: 'redondeado', estiloTarjeta: 'solido' },
  { id: 'burbujas', nombre: 'Burbujas Creativas', Icono: Droplets, desc: 'Burbujas flotantes y efecto vidrio', colorPrimario: '#0284c7', fondo: 'burbujas', estiloBordes: 'redondeado', estiloTarjeta: 'vidrio' },
  { id: 'calidad', nombre: 'Calidad Esmeralda', Icono: Leaf, desc: 'Verde profesional con micromalla', colorPrimario: '#059669', fondo: 'puntos', estiloBordes: 'suave', estiloTarjeta: 'solido' },
  { id: 'galaxia', nombre: 'Noche Galáctica', Icono: Moon, desc: 'Oscuro de alto impacto y vidrio', colorPrimario: '#818cf8', fondo: 'oscuro', estiloBordes: 'redondeado', estiloTarjeta: 'vidrio' },
  { id: 'aurora', nombre: 'Aurora Boreal', Icono: Sparkles, desc: 'Gradiente animado multicolor', colorPrimario: '#db2777', fondo: 'aurora', estiloBordes: 'redondeado', estiloTarjeta: 'vidrio' },
  { id: 'ondas', nombre: 'Ondas Dinámicas', Icono: Waves, desc: 'Flujo fresco en tonos turquesa', colorPrimario: '#0d9488', fondo: 'ondas', estiloBordes: 'suave', estiloTarjeta: 'solido' },
  { id: 'atardecer', nombre: 'Atardecer Cálido', Icono: Sunrise, desc: 'Tonos cálidos y acogedores', colorPrimario: '#ea580c', fondo: 'calido', estiloBordes: 'redondeado', estiloTarjeta: 'solido' },
  { id: 'nordico', nombre: 'Minimalista Nórdico', Icono: Sun, desc: 'Sobrio, fondo limpio y bordes rectos', colorPrimario: '#334155', fondo: 'claro', estiloBordes: 'recto', estiloTarjeta: 'plano' },
];

export const PALETAS_PRESET = [
  { nombre: 'Azul Vilaseca', hex: '#2563eb' },
  { nombre: 'Azul Marino', hex: '#1e3a8a' },
  { nombre: 'Verde Éxito', hex: '#16a34a' },
  { nombre: 'Verde Esmeralda', hex: '#059669' },
  { nombre: 'Morado Índigo', hex: '#7c3aed' },
  { nombre: 'Carmesí', hex: '#dc2626' },
  { nombre: 'Ámbar Cálido', hex: '#ea580c' },
  { nombre: 'Grafito Moderno', hex: '#334155' },
];

export interface FondoPresetItem {
  id: EstiloFondo;
  nombre: string;
  desc: string;
  Icono: LucideIcon;
}

export const FONDOS_PRESET: FondoPresetItem[] = [
  { id: 'degradado', nombre: 'Degradado clásico', desc: 'Suave y corporativo', Icono: Palette },
  { id: 'burbujas', nombre: 'Burbujas flotantes', desc: 'Animación dinámica en vivo', Icono: Droplets },
  { id: 'puntos', nombre: 'Micromalla de puntos', desc: 'Textura geométrica moderna', Icono: Grid3x3 },
  { id: 'ondas', nombre: 'Ondas luminosas', desc: 'Flujo orgánico multinivel', Icono: Waves },
  { id: 'lineas', nombre: 'Líneas sutiles', desc: 'Rayado diagonal fino', Icono: SlidersHorizontal },
  { id: 'aurora', nombre: 'Aurora boreal', desc: 'Malla multicolor animada', Icono: Sparkles },
  { id: 'oscuro', nombre: 'Noche galáctica', desc: 'Contraste oscuro elegante', Icono: Moon },
  { id: 'claro', nombre: 'Blanco limpio', desc: 'Minimalismo ejecutivo', Icono: Sun },
  { id: 'calido', nombre: 'Cálido atardecer', desc: 'Tonos acogedores de sol', Icono: Sunrise },
  { id: 'menta', nombre: 'Menta fresca', desc: 'Tonos botánicos frescos', Icono: Leaf },
];

/** Genera variables CSS inline para aplicar el color corporativo en cualquier contenedor. */
export function generarVariablesTema(color?: string): Record<string, string> {
  const c = color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#2563eb';
  let hex = c.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
  const num = parseInt(hex.slice(0, 6), 16) || 0x2563eb;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  const rd = Math.round(r * 0.82);
  const gd = Math.round(g * 0.82);
  const bd = Math.round(b * 0.82);

  const rl = Math.round(r * 0.12 + 255 * 0.88);
  const gl = Math.round(g * 0.12 + 255 * 0.88);
  const bl = Math.round(b * 0.12 + 255 * 0.88);

  return {
    '--primary': c,
    '--primary-d': `rgb(${rd}, ${gd}, ${bd})`,
    '--primary-l': `rgb(${rl}, ${gl}, ${bl})`,
    '--primary-ring': `rgba(${r}, ${g}, ${b}, 0.25)`,
  };
}

/** 5 niveles (caritas/estrellas/matriz) equivalentes a 2,4,6,8,10 en la escala 1-10. */
export const NIVELES = [2, 4, 6, 8, 10];
export const CARITAS: NombreEmoji[] = ['llora', 'triste', 'neutral', 'feliz', 'encantado'];
export const esSeccion = (p: { tipo: TipoPregunta }) => p.tipo === 'seccion';
/** Columnas de la matriz tal como se muestran: de "Muy satisfecho" a "Muy insatisfecho". */
export const COLUMNAS_MATRIZ_DEFECTO = ['Muy satisfecho', 'Satisfecho', 'Neutral', 'Insatisfecho', 'Muy insatisfecho'];
export const columnasMatriz = (p: { columnas?: string[] }) =>
  COLUMNAS_MATRIZ_DEFECTO.map((d, i) => p.columnas?.[i]?.trim() || d);

export const ETIQUETAS_NIVEL = ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'];

/** Color de 1 a 10: rojo → amarillo → verde. */
export function colorValor(v: number) {
  const t = (Math.min(10, Math.max(1, v)) - 1) / 9;
  const h = Math.round(t * 130); // 0 = rojo, 130 = verde
  return `hsl(${h} 72% ${t > 0.35 && t < 0.6 ? 48 : 44}%)`;
}

export const TIPOS_INFO: Record<TipoPregunta, { nombre: string; Icono: LucideIcon; desc: string }> = {
  escala: { nombre: 'Escala 1-10', Icono: Hash, desc: 'Del 1 al 10, ideal para recomendación (NPS).' },
  caritas: { nombre: 'Caritas', Icono: SmilePlus, desc: '5 emoticones, de muy insatisfecho a encantado.' },
  estrellas: { nombre: 'Estrellas', Icono: Star, desc: 'Calificación de 1 a 5 estrellas.' },
  unica: { nombre: 'Opción única', Icono: CircleDot, desc: 'El cliente elige una sola opción.' },
  multiple: { nombre: 'Opción múltiple', Icono: ListChecks, desc: 'El cliente puede elegir varias.' },
  matriz: { nombre: 'Matriz', Icono: Grid3x3, desc: 'Varios aspectos calificados de satisfecho a insatisfecho.' },
  texto: { nombre: 'Texto libre', Icono: MessageSquareText, desc: 'Comentarios y sugerencias abiertas.' },
  seccion: { nombre: 'Sección', Icono: LayoutTemplate, desc: 'Tarjeta con título, texto, imagen o enlace entre preguntas.' },
};

/** Tipos que admiten mensajes según la respuesta. */
export const ADMITE_SEGUIMIENTO = new Set<TipoPregunta>(['caritas', 'estrellas', 'escala', 'unica']);

/** Niveles configurables de cada tipo, con su etiqueta. */
export function nivelesSeguimiento(
  t: TipoPregunta,
  rangos?: RangosEscala,
  opciones?: string[]
): { clave: string; etiqueta: string; valor: any }[] {
  if (t === 'unica') {
    return (opciones || []).map((o) => o.trim()).filter(Boolean).map((opt) => ({
      clave: opt,
      etiqueta: opt,
      valor: opt,
    }));
  }
  if (t === 'escala') {
    const b = rangos?.bajoHasta ?? 6;
    const m = rangos?.medioHasta ?? 8;
    return [
      { clave: 'bajo', etiqueta: `Bajo (${b === 1 ? '1' : `1 a ${b}`})`, valor: Math.max(1, Math.round(b / 2)) },
      { clave: 'medio', etiqueta: `Medio (${b + 1 === m ? m : `${b + 1} a ${m}`})`, valor: Math.round((b + 1 + m) / 2) },
      { clave: 'alto', etiqueta: `Alto (${m + 1 === 10 ? '10' : `${m + 1} a 10`})`, valor: 10 },
    ];
  }
  return NIVELES.map((n, i) => ({ clave: String(n), etiqueta: ETIQUETAS_NIVEL[i], valor: n }));
}

/** Qué clave de `seguimiento` corresponde al valor elegido. */
export function claveSeguimiento(t: TipoPregunta, v: any, rangos?: RangosEscala): string {
  if (t === 'unica') return String(v ?? '');
  if (t === 'escala') {
    const b = rangos?.bajoHasta ?? 6;
    const m = rangos?.medioHasta ?? 8;
    return Number(v) <= b ? 'bajo' : Number(v) <= m ? 'medio' : 'alto';
  }
  return String(v);
}

/** Mensajes sugeridos por nivel (se pueden editar). */
export function sugeridos(t: TipoPregunta): Record<string, Seguimiento> {
  if (t === 'unica') return {};
  if (t === 'escala') {
    return {
      bajo: { mensaje: '¿Qué podemos mejorar para tener tu recomendación?', comentario: true },
      medio: { mensaje: 'Gracias por tu respuesta. ¿Qué nos faltó para alcanzar la calificación más alta?', comentario: true },
      alto: { mensaje: '¡Muchas gracias por recomendarnos! Seguiremos trabajando para darte el mejor servicio.', comentario: false },
    };
  }
  if (t === 'caritas') {
    return {
      '2': { mensaje: 'Lamentamos mucho tu experiencia. ¿Qué ocurrió y cómo podemos ayudarte?', comentario: true },
      '4': { mensaje: 'Sentimos no haber cumplido tus expectativas. ¿Qué podemos mejorar?', comentario: true },
      '6': { mensaje: 'Gracias por tu valoración. ¿Qué detalle nos faltó para superar tus expectativas?', comentario: true },
      '8': { mensaje: '¡Nos alegra tu buena experiencia! ¿Hay algún comentario adicional que desees dejarnos?', comentario: false },
      '10': { mensaje: '¡Excelente! Muchas gracias por tu satisfacción. Seguiremos dando lo mejor.', comentario: false },
    };
  }
  if (t === 'estrellas') {
    return {
      '2': { mensaje: 'Lamentamos tu experiencia. ¿Qué podemos solucionar para mejorar?', comentario: true },
      '4': { mensaje: 'Sentimos no haber alcanzado lo esperado. ¿Qué podemos mejorar?', comentario: true },
      '6': { mensaje: 'Gracias por tu calificación. ¿Qué nos faltó para alcanzar las 5 estrellas?', comentario: true },
      '8': { mensaje: '¡Muchas gracias por tus 4 estrellas! ¿Qué detalle nos faltó para la calificación perfecta?', comentario: false },
      '10': { mensaje: '¡Muchas gracias por las 5 estrellas! Nos motiva a seguir brindándote el mejor servicio.', comentario: false },
    };
  }
  return {};
}

/** Clave donde se guarda el comentario de seguimiento dentro de `respuestas`. */
export const claveComentario = (id: string) => `${id}__c`;

/** Reemplaza {Etiqueta} por el dato que el cliente llenó al inicio (si no lo llenó, lo quita). */
export function rellenarDatos(texto: string, campos: Campo[], valores: Record<string, string>, ejemplo = false) {
  return texto
    .replace(/\{([^{}]{1,60})\}/g, (m, nombre: string) => {
      const c = campos.find((x) => x.etiqueta.trim().toLowerCase() === nombre.trim().toLowerCase());
      if (!c) return m;
      const v = valores[c.id]?.trim();
      return v || (ejemplo ? `[${c.etiqueta}]` : '');
    })
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export const uid = () => Math.random().toString(36).slice(2, 10);
