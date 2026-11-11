import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Hourglass, Send, Timer } from 'lucide-react';
import { AUTO_AVANZA, Entrada, estaRespondida, PanelSeguimiento, seguimientoDe } from './Inputs';
import { Emoji } from './Emoji';
import { claveComentario, type EncuestaPublica } from '../types';

const logoImg = '/logo.png';

type Datos = Pick<EncuestaPublica, 'titulo' | 'descripcion' | 'mensajeFinal' | 'preguntas' | 'camposCliente' | 'fechaLimite' | 'tema'>;

/** Reloj aislado: solo este componente se repinta cada segundo. */
const Reloj = memo(function Reloj({ hasta, onFin }: { hasta: string; onFin: () => void }) {
  const [ms, setMs] = useState(() => +new Date(hasta) - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const r = +new Date(hasta) - Date.now();
      setMs(r);
      if (r <= 0) { clearInterval(t); onFin(); }
    }, 1000);
    return () => clearInterval(t);
  }, [hasta, onFin]);
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const partes = [
    [Math.floor(s / 86400), 'días'], [Math.floor((s % 86400) / 3600), 'horas'],
    [Math.floor((s % 3600) / 60), 'min'], [s % 60, 'seg'],
  ] as const;
  return (
    <div className="reloj" aria-label="Tiempo restante">
      <span className="reloj-t"><Timer size={18} /> Cierra en</span>
      {partes.map(([n, l]) => (
        <span className="reloj-c" key={l}><b>{String(n).padStart(2, '0')}</b><small>{l}</small></span>
      ))}
    </div>
  );
});

interface Props {
  encuesta: Datos;
  enviar: (payload: { respondiente: Record<string, string>; respuestas: Record<string, any> }) => Promise<void>;
  preview?: boolean;
}

export default function Runner({ encuesta, enviar, preview }: Props) {
  const { preguntas, camposCliente } = encuesta;
  const [paso, setPaso] = useState(0); // 0 = bienvenida, 1..n = preguntas, n+1 = gracias
  const [dir, setDir] = useState<'der' | 'izq'>('der');
  const [transicionando, setTransicionando] = useState(false);
  const [resp, setResp] = useState<Record<string, any>>({});
  const [cli, setCli] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [vencida, setVencida] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const transTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const n = preguntas.length;

  useEffect(() => () => {
    clearTimeout(timer.current);
    clearTimeout(transTimer.current);
  }, []);
  useEffect(() => { setPaso(0); setResp({}); setCli({}); setError(''); setTransicionando(false); }, [encuesta.preguntas, encuesta.camposCliente]);

  const ir = useCallback((to: number) => {
    if (to === paso || transicionando) return;
    setTransicionando(true);
    setDir(to > paso ? 'der' : 'izq');
    clearTimeout(transTimer.current);
    transTimer.current = setTimeout(() => {
      setPaso(to);
      setError('');
      setTransicionando(false);
    }, 180);
  }, [paso, transicionando]);

  const enviarTodo = useCallback(async () => {
    setEnviando(true);
    setError('');
    try {
      await enviar({ respondiente: cli, respuestas: resp });
      setTransicionando(true);
      setDir('der');
      clearTimeout(transTimer.current);
      transTimer.current = setTimeout(() => {
        setPaso(n + 1);
        setTransicionando(false);
      }, 180);
    } catch (e: any) {
      setError(e.message || 'No se pudo enviar');
      setTransicionando(false);
    } finally {
      setEnviando(false);
    }
  }, [enviar, cli, resp, n]);

  if (vencida && paso <= n) {
    return <div className="runner-msg"><div className="big icono-grande"><Hourglass size={52} strokeWidth={1.5} /></div><h2>La encuesta ya cerró</h2><p>Gracias por tu interés.</p></div>;
  }

  const animClase = transicionando ? `paso-saliendo-${dir}` : `paso-${dir}`;

  // ---- bienvenida ----
  if (paso === 0) {
    const faltan = camposCliente.some((c) => c.obligatorio && !cli[c.id]?.trim());
    return (
      <section className={`paso ${animClase} paso-intro`} key="intro">
        {encuesta.tema?.mostrarLogo !== false && (
          <div className="runner-logo-box">
            <img src={logoImg} alt="CaliTori" className="runner-logo-img" />
          </div>
        )}
        <h1 className="runner-titulo">{encuesta.titulo}</h1>
        {encuesta.descripcion && <p className="lead">{encuesta.descripcion}</p>}
        {encuesta.fechaLimite && <Reloj hasta={encuesta.fechaLimite} onFin={() => setVencida(true)} />}
        {camposCliente.length > 0 && (
          <form className="campos" onSubmit={(e) => { e.preventDefault(); if (!faltan) ir(1); }}>
            {camposCliente.map((c) => (
              <label key={c.id} className="campo">
                <span>{c.etiqueta}{c.obligatorio && ' *'}</span>
                <input className="input" type={c.tipo === 'email' ? 'email' : c.tipo === 'telefono' ? 'tel' : 'text'} maxLength={200}
                  value={cli[c.id] || ''} onChange={(e) => setCli((s) => ({ ...s, [c.id]: e.target.value }))} />
              </label>
            ))}
          </form>
        )}
        <div className="acciones">
          <button className="btn primary lg" disabled={faltan} onClick={() => ir(1)}>Comenzar <ArrowRight size={18} /></button>
        </div>
        <p className="muted center">{n} {n === 1 ? 'pregunta' : 'preguntas'} · menos de {Math.max(1, Math.ceil(n / 3))} min</p>
      </section>
    );
  }

  // ---- gracias ----
  if (paso > n) {
    return (
      <div className={`runner-msg paso ${animClase}`} key="fin">
        <div className="big"><Emoji n="fiesta" size={72} /></div>
        <h2>{encuesta.mensajeFinal || '¡Gracias por tu opinión!'}</h2>
        {preview ? <button className="btn ghost" onClick={() => { setResp({}); ir(0); }}>Reiniciar vista previa</button>
          : <p className="muted">Ya puedes cerrar esta ventana.</p>}
      </div>
    );
  }

  // ---- pregunta ----
  const p = preguntas[paso - 1];
  const v = resp[p.id];
  const ok = !p.obligatoria || estaRespondida(p, v);
  const ultima = paso === n;

  const cambiar = (val: any) => {
    setResp((s) => {
      const r = { ...s, [p.id]: val };
      // si el nuevo valor ya no pide comentario, se descarta el que hubiera escrito
      if (!seguimientoDe(p, val)?.comentario) delete r[claveComentario(p.id)];
      return r;
    });
    if (AUTO_AVANZA.has(p.tipo) && !ultima && !seguimientoDe(p, val)) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => ir(paso + 1), 280);
    }
  };

  return (
    <div className="runner">
      <div className="progreso" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={paso - 1}>
        <i style={{ width: `${((paso - 1) / n) * 100}%` }} />
      </div>
      <section className={`paso ${animClase}`} key={p.id}>
        <p className="contador">Pregunta {paso} de {n}</p>
        <h2 className="pregunta">{p.texto}{p.obligatoria && <em title="Obligatoria"> *</em>}</h2>
        <div className="respuesta"><Entrada p={p} value={v} onChange={cambiar} /></div>
        <PanelSeguimiento p={p} value={v} comentario={resp[claveComentario(p.id)] || ''}
          onComentario={(t) => setResp((s) => ({ ...s, [claveComentario(p.id)]: t }))} />
        {error && <p className="error">{error}</p>}
        <div className="acciones entre">
          <button className="btn ghost" onClick={() => { clearTimeout(timer.current); ir(paso - 1); }}><ArrowLeft size={18} /> Atrás</button>
          {ultima ? (
            <button className="btn primary lg" disabled={!ok || enviando} onClick={enviarTodo}>{enviando ? 'Enviando…' : <><Send size={18} /> Enviar respuestas</>}</button>
          ) : (
            <button className="btn primary" disabled={!ok} onClick={() => { clearTimeout(timer.current); ir(paso + 1); }}>
              {!p.obligatoria && !estaRespondida(p, v) ? 'Omitir' : 'Siguiente'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
