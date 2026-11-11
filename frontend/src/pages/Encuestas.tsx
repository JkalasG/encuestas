import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, Check, ClipboardList, Copy, ExternalLink, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import type { Encuesta } from '../types';

export const urlPublica = (slug: string) => `${location.origin}/s/${slug}`;

function estadoDe(e: Encuesta) {
  if (!e.activo) return { t: 'Pausada', c: 'gris' };
  if (e.fechaLimite && new Date(e.fechaLimite) < new Date()) return { t: 'Vencida', c: 'rojo' };
  if (e.maxRespuestas && (e.respuestas || 0) >= e.maxRespuestas) return { t: 'Completa', c: 'azul' };
  return { t: 'Activa', c: 'verde' };
}

export default function Encuestas() {
  const [lista, setLista] = useState<Encuesta[] | null>(null);
  const [copiado, setCopiado] = useState('');
  const nav = useNavigate();

  const cargar = () => api<Encuesta[]>('/encuestas').then(setLista);
  useEffect(() => { cargar(); }, []);

  const copiar = async (slug: string) => {
    try { await navigator.clipboard.writeText(urlPublica(slug)); } catch { prompt('Copia el enlace:', urlPublica(slug)); }
    setCopiado(slug);
    setTimeout(() => setCopiado(''), 1800);
  };
  const alternar = async (e: Encuesta) => {
    await api(`/encuestas/${e.id}/estado`, { method: 'PATCH', body: { activo: !e.activo } });
    setLista((l) => l!.map((x) => (x.id === e.id ? { ...x, activo: !e.activo } : x)));
  };
  const borrar = async (e: Encuesta) => {
    if (!confirm(`¿Eliminar "${e.titulo}" y sus ${e.respuestas} respuestas? No se puede deshacer.`)) return;
    await api(`/encuestas/${e.id}`, { method: 'DELETE' });
    setLista((l) => l!.filter((x) => x.id !== e.id));
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Mis encuestas</h1><p className="muted">Crea, comparte y administra tus encuestas.</p></div>
        <button className="btn primary" onClick={() => nav('/encuestas/nueva')}><Plus size={18} /> Nueva encuesta</button>
      </div>

      {!lista && <div className="center-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>}
      {lista && lista.length === 0 && (
        <div className="vacio"><div className="big icono-grande"><ClipboardList size={52} strokeWidth={1.5} /></div><h3>Aún no tienes encuestas</h3>
          <p className="muted">Crea la primera en un par de minutos.</p>
          <Link className="btn primary" to="/encuestas/nueva">Crear encuesta</Link></div>
      )}

      <div className="grid-cards">
        {lista?.map((e) => {
          const st = estadoDe(e);
          return (
            <article className="card enc" key={e.id}>
              <div className="enc-top"><h3>{e.titulo}</h3><span className={`pill ${st.c}`}>{st.t}</span></div>
              <p className="muted">{e.preguntas.length} preguntas · <b>{e.respuestas}</b> respuestas{e.fechaLimite && ` · cierra ${new Date(e.fechaLimite).toLocaleDateString()}`}</p>
              <div className="enlace">
                <a href={urlPublica(e.slug!)} target="_blank" rel="noreferrer">/s/{e.slug} <ExternalLink size={13} /></a>
                <button className="btn sm" onClick={() => copiar(e.slug!)}>{copiado === e.slug ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}</button>
              </div>
              <div className="enc-acc">
                <Link className="btn sm" to={`/encuestas/${e.id}`}><Pencil size={14} /> Editar</Link>
                <Link className="btn sm" to={`/respuestas/${e.id}`}><BarChart3 size={14} /> Respuestas</Link>
                <button className="btn sm ghost" onClick={() => alternar(e)}>{e.activo ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Reanudar</>}</button>
                <button className="btn sm ghost danger" onClick={() => borrar(e)} aria-label="Eliminar"><Trash2 size={15} /></button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
