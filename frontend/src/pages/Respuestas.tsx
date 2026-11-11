import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Inbox } from 'lucide-react';
import { api } from '../api';
import type { Encuesta } from '../types';

export default function Respuestas() {
  const [lista, setLista] = useState<Encuesta[] | null>(null);
  useEffect(() => { api<Encuesta[]>('/encuestas').then(setLista); }, []);
  const total = lista?.reduce((s, e) => s + (e.respuestas || 0), 0) ?? 0;

  return (
    <>
      <div className="page-head">
        <div><h1>Respuestas</h1><p className="muted">Elige una encuesta para analizar sus resultados y exportarlos a Excel.</p></div>
        {lista && <div className="kpi mini"><b>{total}</b><span>respuestas en total</span></div>}
      </div>
      {!lista && <div className="center-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>}
      {lista?.length === 0 && (
        <div className="vacio"><div className="big icono-grande"><Inbox size={52} strokeWidth={1.5} /></div><h3>Todavía no hay encuestas</h3>
          <Link className="btn primary" to="/encuestas/nueva">Crear encuesta</Link></div>
      )}
      <div className="grid-cards">
        {lista?.map((e) => (
          <Link key={e.id} to={`/respuestas/${e.id}`} className="card enc link-card">
            <h3>{e.titulo}</h3>
            <div className="kpi"><b>{e.respuestas}</b><span>{e.respuestas === 1 ? 'respuesta' : 'respuestas'}</span></div>
            <p className="muted">/s/{e.slug} · {e.preguntas.length} preguntas</p>
            <span className="ver">Ver análisis <ArrowRight size={16} /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
