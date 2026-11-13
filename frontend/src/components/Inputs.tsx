import { memo, useState } from 'react';
import { Check, Star } from 'lucide-react';
import { Emoji } from './Emoji';
import {
  ADMITE_SEGUIMIENTO, CARITAS, claveSeguimiento, colorValor, columnasMatriz, ETIQUETAS_NIVEL, NIVELES, type Pregunta,
} from '../types';

interface P { p: Pregunta; value: any; onChange: (v: any) => void }

const Escala = memo(function Escala({ value, onChange }: Omit<P, 'p'>) {
  return (
    <div>
      <div className="escala" role="radiogroup">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            type="button" key={n} role="radio" aria-checked={value === n}
            className={'escala-n' + (value === n ? ' on' : '')}
            style={value === n ? { background: colorValor(n), borderColor: colorValor(n) } : undefined}
            onClick={() => onChange(n)}
          >{n}</button>
        ))}
      </div>
      <div className="escala-ext">
        <span><Emoji n="pulgarAbajo" size={22} /> Nada probable</span>
        <span>Muy probable <Emoji n="corazon" size={22} /></span>
      </div>
    </div>
  );
});

const Caritas = memo(function Caritas({ value, onChange }: Omit<P, 'p'>) {
  return (
    <div className="caritas" role="radiogroup">
      {NIVELES.map((n, i) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={ETIQUETAS_NIVEL[i]}
          className={'carita' + (value === n ? ' on' : value ? ' off' : '')} onClick={() => onChange(n)}>
          <Emoji n={CARITAS[i]} size={52} className="emoji" />
          <small>{ETIQUETAS_NIVEL[i]}</small>
        </button>
      ))}
    </div>
  );
});

const Estrellas = memo(function Estrellas({ value, onChange }: Omit<P, 'p'>) {
  const [hover, setHover] = useState(0);
  const activo = hover || (value ? value / 2 : 0);
  return (
    <div className="estrellas" role="radiogroup" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lleno = n <= activo;
        return (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n * 2}
            aria-label={`${n} de 5`}
            className={lleno ? 'on' : ''}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n * 2)}
          >
            <Star size={44} strokeWidth={1.7} fill={lleno ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
});

const Unica = memo(function Unica({ p, value, onChange }: P) {
  return (
    <div className="opciones" role="radiogroup">
      {p.opciones!.map((o) => (
        <button type="button" key={o} role="radio" aria-checked={value === o}
          className={'opcion' + (value === o ? ' on' : '')} onClick={() => onChange(o)}>
          <i className="radio" />{o}
        </button>
      ))}
    </div>
  );
});

const Multiple = memo(function Multiple({ p, value, onChange }: P) {
  const sel: string[] = value || [];
  return (
    <div className="opciones">
      {p.opciones!.map((o) => {
        const on = sel.includes(o);
        return (
          <button type="button" key={o} role="checkbox" aria-checked={on} className={'opcion' + (on ? ' on' : '')}
            onClick={() => onChange(on ? sel.filter((x) => x !== o) : [...sel, o])}>
            <i className="check">{on && <Check size={14} strokeWidth={3} />}</i>{o}
          </button>
        );
      })}
    </div>
  );
});

const Matriz = memo(function Matriz({ p, value, onChange }: P) {
  const v: Record<string, number> = value || {};
  return (
    <div className="matriz-wrap">
      <div className="matriz">
        <div className="matriz-head">
          <span />
          {columnasMatriz(p).map((e, i) => (
            <span className="matriz-col" key={i}>
              <Emoji n={CARITAS[4 - i]} size={26} className="matriz-emoji" />
              <small>{e}</small>
            </span>
          ))}
        </div>
        {p.filas!.map((f) => (
          <div className="matriz-fila" key={f}>
            <span className="matriz-nombre">{f}</span>
            {NIVELES.slice().reverse().map((n, i) => (
              <button type="button" key={n} aria-label={`${f}: ${columnasMatriz(p)[i]}`} title={columnasMatriz(p)[i]}
                className={'matriz-c' + (v[f] === n ? ' on' : '')}
                style={v[f] === n ? { background: colorValor(n), borderColor: colorValor(n) } : undefined}
                onClick={() => onChange({ ...v, [f]: n })} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

const Texto = memo(function Texto({ p, value, onChange }: P) {
  return <textarea className="input" rows={4} maxLength={2000} placeholder={p.placeholder?.trim() || 'Escribe aquí tu comentario…'} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
});

export function Entrada({ p, value, onChange }: P) {
  switch (p.tipo) {
    case 'escala': return <Escala value={value} onChange={onChange} />;
    case 'caritas': return <Caritas value={value} onChange={onChange} />;
    case 'estrellas': return <Estrellas value={value} onChange={onChange} />;
    case 'unica': return <Unica p={p} value={value} onChange={onChange} />;
    case 'multiple': return <Multiple p={p} value={value} onChange={onChange} />;
    case 'matriz': return <Matriz p={p} value={value} onChange={onChange} />;
    default: return <Texto p={p} value={value} onChange={onChange} />;
  }
}

/** Mensaje configurado para el valor elegido, si lo hay. */
export function seguimientoDe(p: Pregunta, v: any) {
  if (!ADMITE_SEGUIMIENTO.has(p.tipo)) return null;
  if (p.tipo === 'unica') {
    if (typeof v !== 'string' || !v.trim()) return null;
    const s = p.seguimiento?.[v.trim()];
    return s && (s.mensaje.trim() || s.comentario) ? s : null;
  }
  if (typeof v !== 'number') return null;
  const s = p.seguimiento?.[claveSeguimiento(p.tipo, v, p.rangosEscala)];
  return s && (s.mensaje.trim() || s.comentario) ? s : null;
}

/** Mensaje (y caja de comentario opcional) que aparece bajo la calificación. */
export function PanelSeguimiento({ p, value, comentario, onComentario }: {
  p: Pregunta; value: any; comentario: string; onComentario: (t: string) => void;
}) {
  const s = seguimientoDe(p, value);
  if (!s) return null;
  const key = p.tipo === 'unica' ? String(value) : claveSeguimiento(p.tipo, value, p.rangosEscala);
  return (
    <div className="seguimiento" key={key}>
      {s.mensaje && <p className="seg-msg">{s.mensaje}</p>}
      {s.comentario && (
        <textarea className="input" rows={2} maxLength={1000}
          placeholder={s.placeholder?.trim() || (s.comentarioObligatorio ? 'Cuéntanos más…' : 'Cuéntanos más (opcional)…')}
          required={!!s.comentarioObligatorio}
          value={comentario} onChange={(e) => onComentario(e.target.value)} />
      )}
    </div>
  );
}

/** Tipos que avanzan solos al elegir (si el valor no tiene mensaje de seguimiento). */
export const AUTO_AVANZA = new Set(['escala', 'caritas', 'estrellas', 'unica']);

/** True si el valor elegido pide un comentario obligatorio y aún está vacío. */
export function faltaComentario(p: Pregunta, v: any, comentario?: string) {
  const s = seguimientoDe(p, v);
  return !!(s?.comentario && s.comentarioObligatorio && !(comentario || '').trim());
}

export function estaRespondida(p: Pregunta, v: any) {
  if (v === undefined || v === null || v === '') return false;
  if (p.tipo === 'multiple') return v.length > 0;
  if (p.tipo === 'matriz') return p.filas!.every((f) => v[f] !== undefined);
  return true;
}
