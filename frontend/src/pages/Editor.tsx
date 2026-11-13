import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import {
  AlertCircle, ArrowDown, ArrowUp, Check, Eye, ImagePlus, LayoutTemplate, Mail, Monitor, Palette, Plus, Save, Settings,
  Smartphone, Sparkles, Trash2, X
} from 'lucide-react';
import { Emoji } from '../components/Emoji';
import { Entrada, PanelSeguimiento } from '../components/Inputs';
import Runner from '../components/Runner';
import SecretoCaliTori from '../components/SecretoCaliTori';
import { ToastContainer, type ToastNotif } from '../components/Toast';
import {
  ADMITE_SEGUIMIENTO, ASUNTO_CLIENTE_DEFECTO, CARITAS, columnasMatriz, COLUMNAS_MATRIZ_DEFECTO, esSeccion, ETIQUETA_GMAIL,
  FONDOS_PRESET, MENSAJE_CLIENTE_DEFECTO, generarVariablesTema, NIVELES, nivelesSeguimiento,
  PALETAS_PRESET, rellenarDatos, TEMAS_PRESET, sugeridos, TIPOS_INFO, uid, type Campo, type Configuracion, type Encuesta, type Pregunta,
  type Seguimiento, type TemaEncuesta, type TipoPregunta,
} from '../types';
import { urlPublica } from './Encuestas';

const vacia = (): Encuesta => ({
  titulo: '', descripcion: '', mensajeFinal: '¡Gracias por tu opinión!', preguntas: [], camposCliente: [],
  fechaLimite: null, maxRespuestas: null, 
  configuracion: { avisarAdmin: true, confirmarCliente: false },
  tema: { colorPrimario: '#2563eb', fondo: 'degradado', estiloBordes: 'redondeado' },
});

const nueva = (tipo: TipoPregunta): Pregunta => ({
  id: uid(), tipo, texto: '', obligatoria: tipo === 'escala',
  ...(tipo === 'unica' || tipo === 'multiple' ? { opciones: ['Opción 1', 'Opción 2'] } : {}),
  ...(tipo === 'matriz' ? { filas: ['Atención', 'Ambiente', 'Productos', 'Ubicación'] } : {}),
});

const PRESETS: Omit<Campo, 'id'>[] = [
  { etiqueta: 'Nombre', tipo: 'texto', obligatorio: false },
  { etiqueta: 'Empresa', tipo: 'texto', obligatorio: false },
  { etiqueta: 'Correo', tipo: 'email', obligatorio: false },
  { etiqueta: 'Teléfono', tipo: 'telefono', obligatorio: false },
];

const aLocal = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/** Reduce la imagen subida (máx. 900 px, JPEG) para guardarla dentro de la encuesta. */
function comprimirImagen(file: File): Promise<string> {
  return new Promise((ok, fallo) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const g = c.getContext('2d')!;
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const out = c.toDataURL('image/jpeg', 0.82);
      if (out.length > 560_000) fallo(new Error('La imagen es demasiado pesada, usa una más pequeña'));
      else ok(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallo(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

/** Editor de una tarjeta de sección (título, descripción, imagen y/o enlace; todo opcional). */
const EditorSeccion = memo(function EditorSeccion({ q, i, total, vacia, onChange, onMove, onRemove, onError }: {
  q: Pregunta; i: number; total: number; vacia: boolean;
  onChange: (id: string, c: Partial<Pregunta>) => void; onMove: (i: number, d: number) => void; onRemove: (id: string) => void;
  onError: (m: string) => void;
}) {
  const subir = async (f?: File) => {
    if (!f) return;
    try { onChange(q.id, { imagen: await comprimirImagen(f) }); } catch (e: any) { onError(e.message); }
  };
  return (
    <div className={`card q-edit seccion-edit ${vacia ? 'card-error' : ''}`} id={`pregunta-${q.id}`}>
      <div className="q-head">
        <span className="q-tipo"><LayoutTemplate size={15} /> Sección</span>
        <span className="spacer" />
        <button className="btn sm ghost" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label="Subir"><ArrowUp size={16} /></button>
        <button className="btn sm ghost" disabled={i === total - 1} onClick={() => onMove(i, 1)} aria-label="Bajar"><ArrowDown size={16} /></button>
        <button className="btn sm ghost danger" onClick={() => onRemove(q.id)} aria-label="Eliminar"><Trash2 size={16} /></button>
      </div>
      <p className="muted sm">Tarjeta informativa entre preguntas. Completa solo lo que necesites: título, descripción, imagen o enlace.</p>
      <label className="campo"><span>Título</span>
        <input id={`input-pregunta-${q.id}`} className="input" maxLength={200} value={q.titulo || ''} placeholder="Ej: Sobre nuestro servicio de transporte"
          onChange={(e) => onChange(q.id, { titulo: e.target.value })} /></label>
      <label className="campo"><span>Descripción</span>
        <textarea className="input" rows={3} maxLength={1500} value={q.descripcion || ''} onChange={(e) => onChange(q.id, { descripcion: e.target.value })} /></label>
      <div className="campo">
        <span>Imagen</span>
        {q.imagen && <img className="seccion-img-prev" src={q.imagen} alt="" />}
        <div className="row">
          <input className="input" placeholder="Pega la dirección (URL) de una imagen" value={q.imagen?.startsWith('data:') ? '' : q.imagen || ''}
            onChange={(e) => onChange(q.id, { imagen: e.target.value.trim() })} />
          <label className="btn sm"><ImagePlus size={15} /> Subir
            <input type="file" accept="image/*" hidden onChange={(e) => { subir(e.target.files?.[0]); e.target.value = ''; }} /></label>
          {q.imagen && <button className="btn sm ghost danger" onClick={() => onChange(q.id, { imagen: '' })}><Trash2 size={14} /> Quitar</button>}
        </div>
      </div>
      <div className="dos">
        <label className="campo"><span>Enlace (https://…)</span>
          <input className="input" maxLength={600} value={q.enlace || ''} placeholder="https://" onChange={(e) => onChange(q.id, { enlace: e.target.value.trim() })} /></label>
        <label className="campo"><span>Texto del botón del enlace</span>
          <input className="input" maxLength={80} value={q.enlaceTexto || ''} placeholder="Abrir enlace" onChange={(e) => onChange(q.id, { enlaceTexto: e.target.value })} /></label>
      </div>
      {vacia && <span className="campo-error-msg"><AlertCircle size={14} /> Agrega al menos un título, descripción, imagen o enlace</span>}
    </div>
  );
});

/** Muestra el componente real de la pregunta, para ir viendo cómo queda. */
const VistaPregunta = memo(function VistaPregunta({ q, tema }: { q: Pregunta; tema?: TemaEncuesta }) {
  const [valor, setValor] = useState<any>(undefined);
  const [coment, setComent] = useState('');
  const varsTema = useMemo(() => generarVariablesTema(tema?.colorPrimario) as React.CSSProperties, [tema?.colorPrimario]);
  const p = useMemo(() => ({
    ...q, opciones: q.opciones?.filter((o) => o.trim()), filas: q.filas?.filter((o) => o.trim()),
  }), [q]);
  if ((q.tipo === 'unica' || q.tipo === 'multiple') && (p.opciones?.length || 0) < 1) return null;
  if (q.tipo === 'matriz' && !p.filas?.length) return null;
  return (
    <div className="q-preview" style={varsTema}>
      <span className="q-preview-t"><Eye size={14} /> Así lo verá el cliente (puedes probarlo)</span>
      <Entrada p={p} value={valor} onChange={setValor} />
      <PanelSeguimiento p={p} value={valor} comentario={coment} onComentario={setComent} />
    </div>
  );
});

function Nivel({ tipo, clave, etiqueta }: { tipo: TipoPregunta; clave: string; etiqueta: string }) {
  if (tipo === 'caritas') return <span className="nivel"><Emoji n={CARITAS[NIVELES.indexOf(Number(clave))]} size={30} /><small>{etiqueta}</small></span>;
  if (tipo === 'estrellas') return <span className="nivel"><b>{Number(clave) / 2} ★</b><small>{etiqueta}</small></span>;
  return <span className="nivel"><b>{etiqueta}</b></span>;
}

const EditorSeguimiento = memo(function EditorSeguimiento({ q, onChange }: { q: Pregunta; onChange: (id: string, c: Partial<Pregunta>) => void }) {
  const seg = q.seguimiento || {};
  const n = Object.keys(seg).length;
  const bHasta = q.rangosEscala?.bajoHasta ?? 6;
  const mHasta = q.rangosEscala?.medioHasta ?? 8;

  const poner = (clave: string, cambio: Partial<Seguimiento>) => {
    const nuevo: Record<string, Seguimiento> = { ...seg, [clave]: { ...(seg[clave] || { mensaje: '', comentario: false }), ...cambio } };
    if (!nuevo[clave].mensaje.trim() && !nuevo[clave].comentario && cambio.mensaje !== undefined) delete nuevo[clave];
    onChange(q.id, { seguimiento: nuevo });
  };

  const cambiarBajoHasta = (nuevoB: number) => {
    const nuevoM = Math.max(nuevoB + 1, mHasta);
    onChange(q.id, { rangosEscala: { bajoHasta: nuevoB, medioHasta: nuevoM } });
  };

  const cambiarMedioHasta = (nuevoM: number) => {
    onChange(q.id, { rangosEscala: { bajoHasta: bHasta, medioHasta: nuevoM } });
  };

  return (
    <details className="seg-editor" open={n > 0}>
      <summary><Sparkles size={16} /> Mensajes según la respuesta <small className="muted">(opcional){n > 0 && ` · ${n} configurado${n > 1 ? 's' : ''}`}</small></summary>
      <p className="muted sm">Ej.: si el cliente elige una calificación baja, mostrarle “¿Qué podemos mejorar?” y una caja para que escriba.</p>

      {q.tipo === 'escala' && (
        <div className="rangos-cfg">
          <div className="rangos-cfg-title">
            <b>Rangos de calificación:</b>
            <span className="muted sm">Elige qué valores corresponden a cada nivel</span>
          </div>
          <div className="rangos-cfg-inputs">
            <div className="rango-badge bajo">
              <span>Bajo:</span>
              <span className="rango-de">1 a</span>
              <select
                className="select-rango"
                value={bHasta}
                onChange={(e) => cambiarBajoHasta(Number(e.target.value))}
                aria-label="Límite superior del rango Bajo"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="rango-badge medio">
              <span>Medio:</span>
              <span className="rango-de">{bHasta + 1} a</span>
              <select
                className="select-rango"
                value={mHasta}
                onChange={(e) => cambiarMedioHasta(Number(e.target.value))}
                aria-label="Límite superior del rango Medio"
              >
                {Array.from({ length: 9 - bHasta }, (_, i) => bHasta + 1 + i).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="rango-badge alto">
              <span>Alto:</span>
              <b>{mHasta + 1 === 10 ? '10' : `${mHasta + 1} a 10`}</b>
            </div>
          </div>
        </div>
      )}

      <div className="seg-filas">
        {nivelesSeguimiento(q.tipo, q.rangosEscala, q.opciones).length === 0 && q.tipo === 'unica' ? (
          <p className="muted sm" style={{ padding: '8px 4px' }}>
            Agrega opciones a la pregunta en el campo de arriba para configurar comentarios de seguimiento por opción.
          </p>
        ) : (
          nivelesSeguimiento(q.tipo, q.rangosEscala, q.opciones).map((nv) => (
            <div className="seg-fila" key={nv.clave}>
              <Nivel tipo={q.tipo} clave={nv.clave} etiqueta={nv.etiqueta} />
              <input className="input" placeholder="Mensaje (vacío = no mostrar nada)" maxLength={200}
                value={seg[nv.clave]?.mensaje || ''} onChange={(e) => poner(nv.clave, { mensaje: e.target.value })} />
              <label className="check-row" title="Muestra una caja para que el cliente escriba">
                <input type="checkbox" checked={!!seg[nv.clave]?.comentario} onChange={(e) => poner(nv.clave, { comentario: e.target.checked })} /> Pedir comentario
              </label>
              {seg[nv.clave]?.comentario && (
                <div className="seg-extra">
                  <label className="check-row">
                    <input type="checkbox" checked={!!seg[nv.clave]?.comentarioObligatorio} onChange={(e) => poner(nv.clave, { comentarioObligatorio: e.target.checked })} /> Obligatorio
                  </label>
                  <input className="input" maxLength={120} placeholder={seg[nv.clave]?.comentarioObligatorio ? 'Texto de la caja: Cuéntanos más…' : 'Texto de la caja: Cuéntanos más (opcional)…'}
                    value={seg[nv.clave]?.placeholder || ''} onChange={(e) => poner(nv.clave, { placeholder: e.target.value })} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="row">
        <button className="btn sm" onClick={() => onChange(q.id, { seguimiento: sugeridos(q.tipo) })}><Sparkles size={14} /> Usar sugeridos</button>
        {n > 0 && <button className="btn sm ghost" onClick={() => onChange(q.id, { seguimiento: {} })}>Limpiar</button>}
      </div>
    </details>
  );
});

const EditorPregunta = memo(function EditorPregunta({ q, i, num, total, tema, campoError, onChange, onMove, onRemove, onLimpiarError }: {
  q: Pregunta; i: number; num: number; total: number; tema?: TemaEncuesta; campoError?: string | null;
  onChange: (id: string, c: Partial<Pregunta>) => void; onMove: (i: number, d: number) => void; onRemove: (id: string) => void;
  onLimpiarError?: () => void;
}) {
  const info = TIPOS_INFO[q.tipo];
  const tieneErrorTexto = campoError === `pregunta-${q.id}`;
  const tieneErrorOpciones = campoError === `pregunta-opciones-${q.id}`;
  const tieneErrorFilas = campoError === `pregunta-filas-${q.id}`;

  const lista = (k: 'opciones' | 'filas', label: string, tieneError: boolean) => (
    <label className="campo">
      <span>{label} (una por línea)</span>
      <textarea
        id={`textarea-${k}-${q.id}`}
        className={`input ${tieneError ? 'input-error' : ''}`}
        rows={4}
        value={(q[k] || []).join('\n')}
        onChange={(e) => {
          if (tieneError && onLimpiarError) onLimpiarError();
          onChange(q.id, { [k]: e.target.value.split('\n') });
        }}
      />
      {tieneError && (
        <span className="campo-error-msg">
          <AlertCircle size={14} /> {k === 'opciones' ? 'Agrega al menos 2 opciones de respuesta' : 'Agrega al menos un aspecto a calificar'}
        </span>
      )}
    </label>
  );

  return (
    <div className={`card q-edit ${tieneErrorTexto || tieneErrorOpciones || tieneErrorFilas ? 'card-error' : ''}`} id={`pregunta-${q.id}`}>
      <div className="q-head">
        <span className="q-tipo"><info.Icono size={15} /> {info.nombre}</span>
        <span className="spacer" />
        <button className="btn sm ghost" disabled={i === 0} onClick={() => onMove(i, -1)} aria-label="Subir"><ArrowUp size={16} /></button>
        <button className="btn sm ghost" disabled={i === total - 1} onClick={() => onMove(i, 1)} aria-label="Bajar"><ArrowDown size={16} /></button>
        <button className="btn sm ghost danger" onClick={() => onRemove(q.id)} aria-label="Eliminar"><Trash2 size={16} /></button>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={q.titulo !== undefined} onChange={(e) => onChange(q.id, { titulo: e.target.checked ? '' : undefined })} /> Agregar título sobre la pregunta
      </label>
      {q.titulo !== undefined && (
        <input className="input" value={q.titulo} maxLength={120} placeholder="Ej: Atención al cliente" autoFocus
          onChange={(e) => onChange(q.id, { titulo: e.target.value })} />
      )}
      <label className="campo">
        <span>Pregunta {num} *</span>
        <input
          id={`input-pregunta-${q.id}`}
          className={`input ${tieneErrorTexto ? 'input-error' : ''}`}
          value={q.texto}
          maxLength={300}
          placeholder="Ej: ¿Qué tan probable es que nos recomiendes?"
          onChange={(e) => {
            if (tieneErrorTexto && onLimpiarError) onLimpiarError();
            onChange(q.id, { texto: e.target.value });
          }}
        />
        {tieneErrorTexto && (
          <span className="campo-error-msg"><AlertCircle size={14} /> El texto de la pregunta es obligatorio</span>
        )}
      </label>
      {(q.tipo === 'unica' || q.tipo === 'multiple') && lista('opciones', 'Opciones', tieneErrorOpciones)}
      {q.tipo === 'matriz' && lista('filas', 'Aspectos a calificar', tieneErrorFilas)}
      {q.tipo === 'matriz' && (
        <div className="campo">
          <span>Títulos de las columnas <small className="muted">(de más a menos satisfecho; cada una lleva su carita)</small></span>
          <div className="cols-matriz">
            {columnasMatriz(q).map((c, k) => (
              <label key={k} className="col-matriz">
                <Emoji n={CARITAS[4 - k]} size={30} />
                <input className="input" maxLength={40} value={q.columnas?.[k] ?? COLUMNAS_MATRIZ_DEFECTO[k]} placeholder={COLUMNAS_MATRIZ_DEFECTO[k]}
                  onChange={(e) => {
                    const a = COLUMNAS_MATRIZ_DEFECTO.map((d, x) => q.columnas?.[x] ?? d);
                    a[k] = e.target.value;
                    onChange(q.id, { columnas: a });
                  }} />
              </label>
            ))}
          </div>
        </div>
      )}
      {q.tipo === 'texto' && (
        <label className="campo">
          <span>Texto de ayuda dentro de la caja <small className="muted">(opcional)</small></span>
          <input className="input" maxLength={120} value={q.placeholder || ''} placeholder="Escribe aquí tu comentario…"
            onChange={(e) => onChange(q.id, { placeholder: e.target.value })} />
        </label>
      )}
      <label className="check-row"><input type="checkbox" checked={q.obligatoria} onChange={(e) => onChange(q.id, { obligatoria: e.target.checked })} /> Respuesta obligatoria</label>
      <VistaPregunta q={q} tema={tema} />
      {ADMITE_SEGUIMIENTO.has(q.tipo) && <EditorSeguimiento q={q} onChange={onChange} />}
    </div>
  );
});

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [enc, setEnc] = useState<Encuesta>(vacia);
  const [slug, setSlug] = useState('');
  const [cargando, setCargando] = useState(!!id);
  const [guardando, setGuardando] = useState(false);
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const [campoError, setCampoError] = useState<string | null>(null);
  const [vista, setVista] = useState(false);
  const [modalApariencia, setModalApariencia] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [dispositivoPreview, setDispositivoPreview] = useState<'movil' | 'escritorio'>('movil');

  const notificar = (titulo: string, mensaje: string, tipo: 'error' | 'aviso' | 'exito' = 'error') => {
    const tid = uid();
    setToasts((prev) => [...prev, { id: tid, titulo, mensaje, tipo }]);
  };

  const quitarToast = (tid: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== tid));
  };

  useEffect(() => {
    if (!id) return;
    api<Encuesta>(`/encuestas/${id}`)
      .then((e) => {
        setEnc({
          ...e,
          tema: e.tema || { colorPrimario: '#2563eb', fondo: 'degradado', estiloBordes: 'redondeado' },
        });
        setSlug(e.slug || '');
      })
      .catch((e) => notificar('Error al cargar', e.message))
      .finally(() => setCargando(false));
  }, [id]);

  const set = <K extends keyof Encuesta>(k: K, v: Encuesta[K]) => setEnc((s) => ({ ...s, [k]: v }));

  const setTema = <K extends keyof TemaEncuesta>(k: K, v: TemaEncuesta[K]) =>
    setEnc((s) => ({
      ...s,
      tema: {
        ...(s.tema || { colorPrimario: '#2563eb', fondo: 'degradado', estiloBordes: 'redondeado' }),
        [k]: v,
      },
    }));

  const cambiarP = useCallback((pid: string, c: Partial<Pregunta>) => setEnc((s) => ({ ...s, preguntas: s.preguntas.map((p) => (p.id === pid ? { ...p, ...c } : p)) })), []);
  const mover = useCallback((i: number, d: number) => setEnc((s) => {
    const a = [...s.preguntas]; [a[i], a[i + d]] = [a[i + d], a[i]]; return { ...s, preguntas: a };
  }), []);
  const insertarSeccion = (pos: number) => setEnc((s) => {
    const a = [...s.preguntas];
    a.splice(pos, 0, nueva('seccion'));
    return { ...s, preguntas: a };
  });
  const quitar = useCallback((pid: string) => setEnc((s) => ({ ...s, preguntas: s.preguntas.filter((p) => p.id !== pid) })), []);

  const setConfig = (c: Partial<Configuracion>) =>
    setEnc((s) => ({ ...s, configuracion: { avisarAdmin: false, confirmarCliente: false, ...s.configuracion, ...c } }));
  const camposCorreo = enc.camposCliente.filter((c) => c.tipo === 'email');
  const areaMensaje = useRef<HTMLTextAreaElement>(null);
  /** Inserta un {dato} en el mensaje del correo al cliente, donde esté el cursor. */
  const insertarEnMensaje = (t: string) => {
    const actual = enc.configuracion?.mensajeCliente ?? MENSAJE_CLIENTE_DEFECTO;
    const el = areaMensaje.current;
    const a = el?.selectionStart ?? actual.length;
    const b = el?.selectionEnd ?? a;
    setConfig({ mensajeCliente: (actual.slice(0, a) + t + actual.slice(b)).slice(0, 1500) });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a + t.length, a + t.length); });
  };
  const inputFinal = useRef<HTMLInputElement>(null);
  /** Inserta {Etiqueta} en el mensaje final, donde esté el cursor. */
  const insertarDato = (etiqueta: string) => {
    const el = inputFinal.current;
    const t = `{${etiqueta.trim()}}`;
    const a = el?.selectionStart ?? enc.mensajeFinal.length;
    const b = el?.selectionEnd ?? a;
    const nuevo = (enc.mensajeFinal.slice(0, a) + t + enc.mensajeFinal.slice(b)).slice(0, 300);
    set('mensajeFinal', nuevo);
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(a + t.length, a + t.length); });
  };

  const tieneCampo = (et: string) => enc.camposCliente.some((c) => c.etiqueta === et);
  const alternarPreset = (p: Omit<Campo, 'id'>) =>
    set('camposCliente', tieneCampo(p.etiqueta) ? enc.camposCliente.filter((c) => c.etiqueta !== p.etiqueta) : [...enc.camposCliente, { ...p, id: uid() }]);

  const guardar = async () => {
    // 1. Validar Título
    if (!enc.titulo.trim()) {
      setCampoError('titulo');
      notificar('Título requerido', 'Por favor escribe un título para la encuesta');
      const el = document.getElementById('input-titulo');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    // 2. Validar que tenga al menos una pregunta
    if (!enc.preguntas.some((p) => !esSeccion(p))) {
      setCampoError('preguntas');
      notificar('Faltan preguntas', 'Agrega al menos una pregunta para poder guardar la encuesta');
      const el = document.getElementById('sec-agregar-pregunta');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 3. Validar texto de cada pregunta y opciones si corresponde
    for (let i = 0; i < enc.preguntas.length; i++) {
      const q = enc.preguntas[i];
      if (esSeccion(q)) {
        const mal = !q.titulo?.trim() && !q.descripcion?.trim() && !q.imagen && !q.enlace?.trim();
        const malEnlace = !!q.enlace?.trim() && !/^https?:\/\/\S+$/i.test(q.enlace.trim());
        if (mal || malEnlace) {
          setCampoError(`seccion-${q.id}`);
          notificar(`Sección ${i + 1}`, mal ? 'Agrega un título, descripción, imagen o enlace, o elimina la sección' : 'El enlace debe empezar con http:// o https://');
          document.getElementById(`pregunta-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        continue;
      }
      if (!q.texto.trim()) {
        setCampoError(`pregunta-${q.id}`);
        notificar(`Pregunta ${i + 1} incompleta`, 'Escribe el texto de la pregunta antes de guardar');
        const el = document.getElementById(`input-pregunta-${q.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        return;
      }

      if (q.tipo === 'unica' || q.tipo === 'multiple') {
        const opcionesValidas = (q.opciones || []).filter((o) => o.trim());
        if (opcionesValidas.length < 2) {
          setCampoError(`pregunta-opciones-${q.id}`);
          notificar(`Pregunta ${i + 1}: Opciones`, 'Debes ingresar al menos 2 opciones de respuesta');
          const el = document.getElementById(`textarea-opciones-${q.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
          return;
        }
      }

      if (q.tipo === 'matriz') {
        const filasValidas = (q.filas || []).filter((f) => f.trim());
        if (filasValidas.length < 1) {
          setCampoError(`pregunta-filas-${q.id}`);
          notificar(`Pregunta ${i + 1}: Matriz`, 'Debes ingresar al menos un aspecto a calificar');
          const el = document.getElementById(`textarea-filas-${q.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
          return;
        }
      }
    }

    // 4. Validar campos de cliente personalizados
    for (let i = 0; i < enc.camposCliente.length; i++) {
      const c = enc.camposCliente[i];
      if (!c.etiqueta.trim()) {
        setCampoError(`cliente-${c.id}`);
        notificar('Dato del cliente', 'El nombre del campo solicitado no puede estar vacío');
        const el = document.getElementById(`input-cliente-${c.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        return;
      }
    }

    setCampoError(null);
    setGuardando(true);
    try {
      const body = { ...enc, slug: slug.trim() };
      if (body.configuracion?.confirmarCliente && !camposCorreo.length) body.configuracion = { ...body.configuracion, confirmarCliente: false };
      await api(id ? `/encuestas/${id}` : '/encuestas', { method: id ? 'PUT' : 'POST', body });
      nav('/encuestas');
    } catch (e: any) {
      notificar('Error al guardar', e.message || 'No se pudo guardar la encuesta');
      setGuardando(false);
    }
  };

  const previa = useMemo(() => ({
    ...enc,
    preguntas: enc.preguntas.map((p) => esSeccion(p) ? p : ({
      ...p,
      texto: p.texto || '(sin texto)',
      opciones: p.opciones?.filter((o) => o.trim()),
      filas: p.filas?.filter((o) => o.trim()),
    })),
  }), [enc]);
  const previaOk = enc.preguntas.some((p) => !esSeccion(p));
  const nPreguntas = enc.preguntas.filter((p) => !esSeccion(p)).length;

  if (cargando) return <div className="center-screen"><div className="spinner" /></div>;

  const varsTema = generarVariablesTema(enc.tema?.colorPrimario) as React.CSSProperties;

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={quitarToast} />

      <div className="editor-head-sticky">
        <div className="editor-head-info">
          <h1>{id ? 'Editar encuesta' : 'Nueva encuesta'}</h1>
          {enc.titulo && <span className="editor-head-sub muted">{enc.titulo}</span>}
        </div>
        <div className="editor-head-actions">
          <button type="button" className="btn btn-apariencia" onClick={() => setModalApariencia(true)}>
            <Palette size={17} /> <span>Apariencia</span>
            <span className="tema-dot-badge" style={{ backgroundColor: enc.tema?.colorPrimario || '#2563eb' }} />
          </button>
          <button type="button" className="btn btn-apariencia" onClick={() => setModalConfig(true)}>
            <Settings size={17} /> <span>Configuración</span>
            {(enc.configuracion?.avisarAdmin || enc.configuracion?.confirmarCliente) && <span className="tema-dot-badge" style={{ backgroundColor: '#16a34a' }} />}
          </button>
          <button type="button" className="btn" disabled={!previaOk} onClick={() => setVista(true)}>
            <Eye size={17} /> <span>Vista previa</span>
          </button>
          <button type="button" className="btn primary" disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : <><Save size={17} /> <span>Guardar</span></>}
          </button>
        </div>
      </div>

      <div className="card sec" id="campo-titulo-sec">
        <h3>General</h3>
        <label className="campo" id="campo-titulo">
          <span>Título de la encuesta *</span>
          <input
            id="input-titulo"
            className={`input ${campoError === 'titulo' ? 'input-error' : ''}`}
            value={enc.titulo}
            maxLength={120}
            placeholder="Ej: Encuesta de satisfacción del cliente"
            onChange={(e) => {
              if (campoError === 'titulo') setCampoError(null);
              set('titulo', e.target.value);
            }}
          />
          {campoError === 'titulo' && (
            <span className="campo-error-msg">
              <AlertCircle size={14} /> El título de la encuesta es obligatorio
            </span>
          )}
        </label>
        <label className="campo">
          <span>Descripción (opcional)</span>
          <textarea className="input" rows={2} maxLength={600} value={enc.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </label>
        <label className="campo">
          <span>Mensaje al terminar</span>
          <input ref={inputFinal} className="input" value={enc.mensajeFinal} maxLength={300} onChange={(e) => set('mensajeFinal', e.target.value)} />
        </label>
        {enc.camposCliente.some((c) => c.etiqueta.trim()) && (
          <div className="campo">
            <span className="muted sm">Poner un dato del cliente dentro del mensaje (ej.: “¡Gracias, {'{Nombre}'}!”):</span>
            <div className="chips">
              {enc.camposCliente.filter((c) => c.etiqueta.trim()).map((c) => (
                <button type="button" key={c.id} className="chip" onClick={() => insertarDato(c.etiqueta)}>
                  <Plus size={14} /> {c.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card sec">
        <h3>Enlace y límites</h3>
        <label className="campo"><span>Enlace personalizado</span>
          <div className="slug"><span>{location.origin}/s/</span>
            <input className="input" value={slug} placeholder="se genera solo si lo dejas vacío" maxLength={40} onChange={(e) => setSlug(e.target.value)} /></div>
          {slug && <small className="muted">Quedará: {urlPublica(slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}</small>}
        </label>
        <div className="dos">
          <label className="campo"><span>Fecha límite (el cliente verá un reloj)</span>
            <input className="input" type="datetime-local" value={aLocal(enc.fechaLimite)}
              onChange={(e) => set('fechaLimite', e.target.value ? new Date(e.target.value).toISOString() : null)} /></label>
          <label className="campo"><span>Máximo de respuestas</span>
            <input className="input" type="number" min={1} placeholder="Sin límite" value={enc.maxRespuestas ?? ''}
              onChange={(e) => set('maxRespuestas', e.target.value ? Math.max(1, Number(e.target.value)) : null)} /></label>
        </div>
      </div>

      <div className="card sec">
        <h3>Datos del cliente <small className="muted">(opcional)</small></h3>
        <p className="muted">Se le piden al cliente antes de empezar. Sin ninguno, la encuesta es anónima.</p>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.etiqueta} className={'chip' + (tieneCampo(p.etiqueta) ? ' on' : '')} onClick={() => alternarPreset(p)}>
              {tieneCampo(p.etiqueta) ? <Check size={14} /> : <Plus size={14} />} {p.etiqueta}
            </button>
          ))}
          <button className="chip" onClick={() => { const e = prompt('Nombre del campo (ej: Sucursal)'); if (e?.trim()) set('camposCliente', [...enc.camposCliente, { id: uid(), etiqueta: e.trim(), tipo: 'texto', obligatorio: false }]); }}><Plus size={14} /> Otro…</button>
        </div>
        {enc.camposCliente.map((c) => (
          <div className="campo-row" key={c.id}>
            <input
              id={`input-cliente-${c.id}`}
              className={`input ${campoError === `cliente-${c.id}` ? 'input-error' : ''}`}
              value={c.etiqueta}
              placeholder="Nombre del campo"
              onChange={(e) => {
                if (campoError === `cliente-${c.id}`) setCampoError(null);
                set('camposCliente', enc.camposCliente.map((x) => (x.id === c.id ? { ...x, etiqueta: e.target.value } : x)));
              }}
            />
            <label className="check-row"><input type="checkbox" checked={c.obligatorio} onChange={(e) => set('camposCliente', enc.camposCliente.map((x) => (x.id === c.id ? { ...x, obligatorio: e.target.checked } : x)))} /> Obligatorio</label>
            <button className="btn sm ghost danger" onClick={() => set('camposCliente', enc.camposCliente.filter((x) => x.id !== c.id))} aria-label="Quitar"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      <h3 className="sec-title">Preguntas ({nPreguntas}){enc.preguntas.length > nPreguntas && ` · ${enc.preguntas.length - nPreguntas} ${enc.preguntas.length - nPreguntas === 1 ? 'sección' : 'secciones'}`}</h3>
      {enc.preguntas.map((q, i) => (
        <div key={q.id}>
          {(
            <button type="button" className="insertar-seccion" onClick={() => insertarSeccion(i)}>
              <Plus size={13} /> Insertar sección aquí
            </button>
          )}
          {esSeccion(q) ? (
            <EditorSeccion
              q={q} i={i} total={enc.preguntas.length} vacia={campoError === `seccion-${q.id}`}
              onChange={(pid, c) => { if (campoError === `seccion-${q.id}`) setCampoError(null); cambiarP(pid, c); }}
              onMove={mover} onRemove={quitar} onError={(m) => notificar('Imagen', m)}
            />
          ) : (
            <EditorPregunta
              q={q}
              i={i}
              num={enc.preguntas.slice(0, i + 1).filter((x) => !esSeccion(x)).length}
              total={enc.preguntas.length}
              tema={enc.tema}
              campoError={campoError}
              onChange={cambiarP}
              onMove={mover}
              onRemove={quitar}
              onLimpiarError={() => setCampoError(null)}
            />
          )}
        </div>
      ))}
      {enc.preguntas.length > 0 && (
        <button type="button" className="insertar-seccion" onClick={() => insertarSeccion(enc.preguntas.length)}>
          <Plus size={13} /> Insertar sección aquí
        </button>
      )}

      <SecretoCaliTori enc={enc} setEnc={setEnc} />

      <div className={`card sec ${campoError === 'preguntas' ? 'sec-error-pulse' : ''}`} id="sec-agregar-pregunta">
        <div className="sec-header-row">
          <h3>Agregar pregunta</h3>
          {campoError === 'preguntas' && (
            <span className="campo-error-badge">
              <AlertCircle size={15} /> Selecciona al menos una pregunta para tu encuesta
            </span>
          )}
        </div>
        <div className="tipos">
          {(Object.keys(TIPOS_INFO) as TipoPregunta[]).filter((t) => t !== 'seccion').map((t) => (
            <button
              key={t}
              className="tipo"
              onClick={() => {
                if (campoError === 'preguntas') setCampoError(null);
                set('preguntas', [...enc.preguntas, nueva(t)]);
              }}
            >
              <span className="tipo-i">{(() => { const I = TIPOS_INFO[t].Icono; return <I size={22} />; })()}</span>
              <b>{TIPOS_INFO[t].nombre}</b>
              <small>{TIPOS_INFO[t].desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-bottom-bar card">
        <div className="editor-bottom-info muted">
          <span>{nPreguntas} {nPreguntas === 1 ? 'pregunta configurada' : 'preguntas configuradas'}</span>
        </div>
        <div className="editor-head-actions">
          <button type="button" className="btn btn-apariencia" onClick={() => setModalApariencia(true)}>
            <Palette size={17} /> <span>Apariencia</span>
            <span className="tema-dot-badge" style={{ backgroundColor: enc.tema?.colorPrimario || '#2563eb' }} />
          </button>
          <button type="button" className="btn btn-apariencia" onClick={() => setModalConfig(true)}>
            <Settings size={17} /> <span>Configuración</span>
            {(enc.configuracion?.avisarAdmin || enc.configuracion?.confirmarCliente) && <span className="tema-dot-badge" style={{ backgroundColor: '#16a34a' }} />}
          </button>
          <button type="button" className="btn" disabled={!previaOk} onClick={() => setVista(true)}>
            <Eye size={17} /> <span>Vista previa</span>
          </button>
          <button type="button" className="btn primary" disabled={guardando} onClick={guardar}>
            {guardando ? 'Guardando…' : <><Save size={17} /> <span>Guardar encuesta</span></>}
          </button>
        </div>
      </div>

      {modalConfig && (
        <div className="modal" onClick={() => setModalConfig(false)}>
          <div className="modal-card modal-config" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-top-title">
                <div className="modal-top-ico"><Settings size={22} /></div>
                <div>
                  <b>Configuración</b>
                  <p className="muted sm">Correos automáticos al recibir una respuesta. Se envían con Gmail y llevan la etiqueta <b>{ETIQUETA_GMAIL}</b>.</p>
                </div>
              </div>
              <button type="button" className="btn sm primary" onClick={() => setModalConfig(false)}><Check size={16} /> Listo</button>
            </div>

            <div className="cfg-seccion">
              <label className="check-row cfg-check">
                <input type="checkbox" checked={!!enc.configuracion?.avisarAdmin} onChange={(e) => setConfig({ avisarAdmin: e.target.checked })} />
                <span><b><Mail size={15} /> Avisarme cuando alguien responda</b></span>
              </label>
              <p className="muted sm">Recibes en el correo de tu cuenta un resumen con los datos del cliente y todas sus respuestas.</p>
            </div>

            <div className="cfg-seccion">
              <label className={'check-row cfg-check' + (camposCorreo.length ? '' : ' disabled')}>
                <input type="checkbox" disabled={!camposCorreo.length} checked={!!enc.configuracion?.confirmarCliente && camposCorreo.length > 0}
                  onChange={(e) => setConfig({ confirmarCliente: e.target.checked })} />
                <span><b><Mail size={15} /> Enviar correo de agradecimiento al cliente</b></span>
              </label>
              {!camposCorreo.length ? (
                <p className="aviso-cfg"><AlertCircle size={15} /> Para activarlo, agrega el dato <b>Correo</b> en “Datos del cliente”. Así sabemos a dónde enviarlo.</p>
              ) : enc.configuracion?.confirmarCliente && (
                <>
                  {camposCorreo.length > 1 && (
                    <label className="campo"><span>Enviar al correo de</span>
                      <select className="input" value={enc.configuracion?.campoCorreoId || camposCorreo[0].id} onChange={(e) => setConfig({ campoCorreoId: e.target.value })}>
                        {camposCorreo.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
                      </select></label>
                  )}
                  <label className="campo"><span>Asunto</span>
                    <input className="input" maxLength={150} value={enc.configuracion?.asuntoCliente ?? ASUNTO_CLIENTE_DEFECTO} onChange={(e) => setConfig({ asuntoCliente: e.target.value })} /></label>
                  <label className="campo"><span>Mensaje</span>
                    <textarea ref={areaMensaje} className="input" rows={5} maxLength={1500} value={enc.configuracion?.mensajeCliente ?? MENSAJE_CLIENTE_DEFECTO} onChange={(e) => setConfig({ mensajeCliente: e.target.value })} /></label>
                  <p className="muted sm">Escribe el mensaje completo, saludo incluido. Usa <code>{'{encuesta}'}</code> para el título y <code>{'{Etiqueta}'}</code> para cualquier dato que el cliente llene (ej. <code>{'{Nombre}'}</code>):</p>
                  <div className="chips">
                    {enc.camposCliente.filter((c) => c.etiqueta.trim()).map((c) => (
                      <button type="button" key={c.id} className="chip" onClick={() => insertarEnMensaje(`{${c.etiqueta.trim()}}`)}><Plus size={14} /> {c.etiqueta}</button>
                    ))}
                    <button type="button" className="chip" onClick={() => insertarEnMensaje('{encuesta}')}><Plus size={14} /> Título de la encuesta</button>
                  </div>
                  <div className="correo-prev">
                    <p className="muted sm"><b>Así llegará el correo</b> (con datos de ejemplo)</p>
                    <div className="correo-meta"><span>Asunto:</span> {enc.configuracion?.asuntoCliente || ASUNTO_CLIENTE_DEFECTO}</div>
                    <div className="correo-marco">
                      <div className="correo-cab">{enc.titulo || 'Título de la encuesta'}</div>
                      <div className="correo-cuerpo">
                        <p>{rellenarDatos((enc.configuracion?.mensajeCliente ?? MENSAJE_CLIENTE_DEFECTO).replace(/\{encuesta\}/gi, enc.titulo || 'Título de la encuesta'), enc.camposCliente, {}, true)}</p>
                        <small>Mensaje automático por Agencia Vilaseca. Por favor no respondas a este correo.</small>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="btn sm ghost" onClick={() => setConfig({ asuntoCliente: ASUNTO_CLIENTE_DEFECTO, mensajeCliente: MENSAJE_CLIENTE_DEFECTO })}>Restablecer mensaje por defecto</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Apariencia en 2 Columnas con Vista Previa en Vivo */}
      {modalApariencia && (
        <div className="modal" onClick={() => setModalApariencia(false)}>
          <div className="modal-card modal-apariencia" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-top-title">
                <div className="modal-top-ico"><Palette size={22} /></div>
                <div>
                  <b>Personalizar Apariencia y Diseño</b>
                  <p className="muted sm">Modifica colores, texturas y fondos visuales con vista previa en tiempo real.</p>
                </div>
              </div>
              <button type="button" className="btn sm primary" onClick={() => setModalApariencia(false)}>
                <Check size={16} /> Listo
              </button>
            </div>

            <div className="modal-apariencia-grid">
              {/* Columna 1: Controles de Configuración */}
              <div className="modal-apariencia-controles">
                {/* 1. Temas con un solo clic */}
                <div className="cfg-seccion">
                  <label className="cfg-label">
                    <span>⚡ Temas prediseñados (1 clic)</span>
                    <small className="muted">Combinaciones armónicas listas para usar</small>
                  </label>
                  <div className="temas-preset-grid">
                    {TEMAS_PRESET.map((tp) => {
                      const activo = enc.tema?.fondo === tp.fondo && (enc.tema?.colorPrimario || '#2563eb').toLowerCase() === tp.colorPrimario.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={tp.id}
                          className={`tema-preset-btn ${activo ? 'on' : ''}`}
                          onClick={() => {
                            setEnc((s) => ({
                              ...s,
                              tema: {
                                colorPrimario: tp.colorPrimario,
                                fondo: tp.fondo,
                                estiloBordes: tp.estiloBordes,
                                estiloTarjeta: tp.estiloTarjeta,
                                mostrarLogo: s.tema?.mostrarLogo !== false,
                              },
                            }));
                          }}
                        >
                          <span className="tema-preset-ico"><tp.Icono size={18} /></span>
                          <div className="tema-preset-info">
                            <b>{tp.nombre}</b>
                            <small>{tp.desc}</small>
                          </div>
                          <span className="tema-preset-dot" style={{ backgroundColor: tp.colorPrimario }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Color Principal / Marca */}
                <div className="cfg-seccion">
                  <label className="cfg-label">
                    <span><Palette size={16} /> Color de marca / Acento</span>
                    <small className="muted">Aplica a botones, selecciones, progreso y calificaciones</small>
                  </label>
                  <div className="paleta-colores">
                    {PALETAS_PRESET.map((p) => {
                      const activo = (enc.tema?.colorPrimario || '#2563eb').toLowerCase() === p.hex.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={p.hex}
                          className={`color-btn ${activo ? 'on' : ''}`}
                          style={{ backgroundColor: p.hex }}
                          onClick={() => setTema('colorPrimario', p.hex)}
                          title={p.nombre}
                          aria-label={p.nombre}
                        >
                          {activo && <Check size={16} color="#fff" strokeWidth={3} />}
                        </button>
                      );
                    })}
                    <label className="color-custom-btn" title="Elegir cualquier color corporativo">
                      <input
                        type="color"
                        className="color-picker-input"
                        value={enc.tema?.colorPrimario || '#2563eb'}
                        onChange={(e) => setTema('colorPrimario', e.target.value)}
                      />
                      <span className="color-custom-txt">Personalizado</span>
                    </label>
                  </div>
                </div>

                {/* 3. Fondos y Texturas */}
                <div className="cfg-seccion">
                  <label className="cfg-label">
                    <span><Sparkles size={16} /> Estilo de fondo y texturas</span>
                    <small className="muted">Selecciona el ambiente visual envolvente</small>
                  </label>
                  <div className="fondos-grid-ampliado">
                    {FONDOS_PRESET.map((f) => {
                      const activo = (enc.tema?.fondo || 'degradado') === f.id;
                      const IconoFondo = f.Icono;
                      return (
                        <button
                          type="button"
                          key={f.id}
                          className={`fondo-btn fondo-btn-${f.id} ${activo ? 'on' : ''}`}
                          onClick={() => setTema('fondo', f.id)}
                        >
                          <div className="fondo-btn-head">
                            <span className="fondo-btn-ico"><IconoFondo size={18} /></span>
                            <b>{f.nombre}</b>
                          </div>
                          <small>{f.desc}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Estilo de tarjeta y bordes */}
                <div className="dos cfg-seccion">
                  <div>
                    <label className="cfg-label">
                      <span>Estilo de tarjeta</span>
                    </label>
                    <div className="opciones-grid-compacto">
                      {[
                        { id: 'solido', nombre: 'Sólida clásica', desc: 'Blanco con sombra' },
                        { id: 'vidrio', nombre: 'Efecto Vidrio', desc: 'Glassmorphism' },
                        { id: 'plano', nombre: 'Plano sutil', desc: 'Minimalista moderno' },
                      ].map((t) => {
                        const activo = (enc.tema?.estiloTarjeta || 'solido') === t.id;
                        return (
                          <button
                            type="button"
                            key={t.id}
                            className={`btn-opcion-cfg ${activo ? 'on' : ''}`}
                            onClick={() => setTema('estiloTarjeta', t.id as any)}
                          >
                            <b>{t.nombre}</b>
                            <small>{t.desc}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="cfg-label">
                      <span>Formato de esquinas</span>
                    </label>
                    <div className="opciones-grid-compacto">
                      {[
                        { id: 'redondeado', nombre: 'Redondeado', desc: '22px moderno' },
                        { id: 'suave', nombre: 'Sutil', desc: '12px curvatura' },
                        { id: 'recto', nombre: 'Recto', desc: 'Corporativo clásico' },
                      ].map((b) => {
                        const activo = (enc.tema?.estiloBordes || 'redondeado') === b.id;
                        return (
                          <button
                            type="button"
                            key={b.id}
                            className={`btn-opcion-cfg ${activo ? 'on' : ''}`}
                            onClick={() => setTema('estiloBordes', b.id as any)}
                          >
                            <b>{b.nombre}</b>
                            <small>{b.desc}</small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Logo */}
                <div className="cfg-seccion check-seccion">
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={enc.tema?.mostrarLogo !== false}
                      onChange={(e) => setTema('mostrarLogo', e.target.checked)}
                    />
                    <span>Mostrar logo de Vilaseca en la bienvenida de la encuesta</span>
                  </label>
                </div>
              </div>

              {/* Columna 2: Vista previa interactiva en tiempo real */}
              <div className="modal-apariencia-preview">
                <div className="preview-toolbar">
                  <span className="preview-label">
                    <Eye size={15} /> Vista previa en tiempo real
                  </span>
                  <div className="preview-dispositivo-switch">
                    <button
                      type="button"
                      className={dispositivoPreview === 'movil' ? 'on' : ''}
                      onClick={() => setDispositivoPreview('movil')}
                      title="Simular pantalla de celular"
                    >
                      <Smartphone size={14} /> Celular
                    </button>
                    <button
                      type="button"
                      className={dispositivoPreview === 'escritorio' ? 'on' : ''}
                      onClick={() => setDispositivoPreview('escritorio')}
                      title="Simular pantalla de computadora"
                    >
                      <Monitor size={14} /> Escritorio
                    </button>
                  </div>
                </div>

                <div className={`preview-viewport-wrapper ${dispositivoPreview}`}>
                  <div
                    className={`publica preview-viewport-canvas tema-fondo-${enc.tema?.fondo || 'degradado'}`}
                    style={varsTema}
                  >
                    {enc.tema?.fondo === 'burbujas' && (
                      <div className="burbujas-decorativas" aria-hidden="true">
                        <span /><span /><span /><span /><span /><span /><span /><span />
                      </div>
                    )}
                    <div
                      className={`publica-card tema-bordes-${enc.tema?.estiloBordes || 'redondeado'} tema-tarjeta-${enc.tema?.estiloTarjeta || 'solido'}`}
                    >
                      <Runner preview encuesta={previa as any} enviar={async () => {}} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {vista && (
        <div className="modal" onClick={() => setVista(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <b>Vista previa (no se guardan respuestas)</b>
              <button className="btn sm ghost" onClick={() => setVista(false)}><X size={15} /> Cerrar</button>
            </div>
            <div
              className={`publica-card sin-sombra tema-bordes-${enc.tema?.estiloBordes || 'redondeado'} tema-tarjeta-${enc.tema?.estiloTarjeta || 'solido'}`}
              style={varsTema}
            >
              <Runner preview encuesta={previa as any} enviar={async () => {}} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
