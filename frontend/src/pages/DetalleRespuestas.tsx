import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, FileSpreadsheet, Inbox, MessageSquareQuote, Star, Table2, Trash2, BarChart3 } from 'lucide-react';
import { api, descargarExcel } from '../api';
import { Emoji, EmojiSvg } from '../components/Emoji';
import { CARITAS, claveComentario, colorValor, ETIQUETAS_NIVEL, NIVELES, type Encuesta, type Pregunta } from '../types';

interface Resumen { total: number; preguntas: any[] }
interface Fila { id: string; creadoEn: string; respondiente?: Record<string, string>; respuestas?: Record<string, any> }

const AZUL = '#2563eb';

function TickCarita({ x, y, payload }: any) {
  return <EmojiSvg n={payload.value} x={x - 14} y={y + 2} size={28} />;
}

const fmtFecha = (d: string) => new Date(d).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' });

const GraficoBase = memo(function GraficoBase({ r }: { r: any }) {
  if (r.total === 0) return <p className="muted">Sin respuestas todavía.</p>;

  if (r.tipo === 'escala' || r.tipo === 'caritas' || r.tipo === 'estrellas') {
    const data = r.distribucion.map((d: any) => ({
      ...d,
      nombre: r.tipo === 'caritas' ? CARITAS[NIVELES.indexOf(d.valor)] : r.tipo === 'estrellas' ? `${d.valor / 2} ★` : String(d.valor),
    }));
    return (
      <div className="chart-row">
        <div className="stats">
          <div className="kpi"><b style={{ color: r.promedio ? colorValor(r.promedio) : undefined }}>{r.promedio ?? '-'}</b><span>promedio / 10</span></div>
          {r.indiceNeto !== undefined && <div className="kpi"><b style={{ color: r.indiceNeto >= 0 ? '#16a34a' : '#dc2626' }}>{r.indiceNeto}</b><span>NPS</span></div>}
        </div>
        <div className="chart"><ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" height={r.tipo === 'caritas' ? 40 : 30} tick={r.tipo === 'caritas' ? <TickCarita /> : { fontSize: 12 }} interval={0} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Respuestas']} labelFormatter={(l) => `Valor ${l}`} />
            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {data.map((d: any) => <Cell key={d.valor} fill={colorValor(d.valor)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer></div>
      </div>
    );
  }

  if (r.tipo === 'unica' || r.tipo === 'multiple') {
    return (
      <div className="chart"><ResponsiveContainer width="100%" height={Math.max(120, r.opciones.length * 42)}>
        <BarChart data={r.opciones} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="opcion" width={140} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [v, 'Respuestas']} />
          <Bar dataKey="cantidad" fill={AZUL} radius={[0, 6, 6, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer></div>
    );
  }

  if (r.tipo === 'matriz') {
    const data = r.filas.map((f: any) => ({ fila: `${f.fila} (${f.promedio ?? '-'})`, ...Object.fromEntries(f.distribucion.map((d: any) => [d.etiqueta, d.cantidad])) }));
    return (
      <>
        <p className="muted sm">Entre paréntesis, el promedio sobre 10.</p>
        <div className="chart"><ResponsiveContainer width="100%" height={Math.max(160, r.filas.length * 54 + 50)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="fila" width={150} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {ETIQUETAS_NIVEL.slice().reverse().map((e, i) => (
              <Bar key={e} dataKey={e} stackId="a" fill={colorValor(NIVELES.slice().reverse()[i])} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer></div>
      </>
    );
  }

  return (
    <ul className="textos">{r.textos.map((t: string, i: number) => <li key={i}>“{t}”</li>)}</ul>
  );
});

const Grafico = memo(function Grafico({ r }: { r: any }) {
  return (
    <>
      <GraficoBase r={r} />
      {r.comentarios?.length > 0 && (
        <div className="coment">
          <h4><MessageSquareQuote size={16} /> Comentarios de seguimiento ({r.comentarios.length})</h4>
          <ul className="textos">
            {r.comentarios.map((c: any, i: number) => (
              <li key={i}><i className="punto" style={{ background: typeof c.valor === 'number' ? colorValor(c.valor) : AZUL }} />{c.texto}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
});

function celda(p: Pregunta, v: any, comentario?: string): ReactNode {
  const base = celdaBase(p, v);
  return comentario ? <>{base}<div className="celda-com">“{comentario}”</div></> : base;
}

function celdaBase(p: Pregunta, v: any): ReactNode {
  if (v === undefined) return '';
  if (p.tipo === 'caritas') return <span className="celda-i"><Emoji n={CARITAS[NIVELES.indexOf(v)]} size={22} /> {v}</span>;
  if (p.tipo === 'estrellas') return <span className="celda-i estrella">{Array.from({ length: v / 2 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</span>;
  if (p.tipo === 'multiple') return v.join(', ');
  if (p.tipo === 'matriz') return Object.entries(v).map(([k, n]) => `${k}: ${n}`).join(' · ');
  return String(v);
}

const POR_PAGINA = 50;

export default function DetalleRespuestas() {
  const { id } = useParams();
  const [enc, setEnc] = useState<Encuesta | null>(null);
  const [res, setRes] = useState<Resumen | null>(null);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [tab, setTab] = useState<'analisis' | 'respuestas'>('analisis');
  const [error, setError] = useState('');
  const [pag, setPag] = useState(1);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    Promise.all([api(`/encuestas/${id}/respuestas`), api<Resumen>(`/encuestas/${id}/resumen`)])
      .then(([d, r]) => { setEnc(d.encuesta); setFilas(d.respuestas); setRes(r); })
      .catch((e) => setError(e.message));
  }, [id]);

  const general = useMemo(() => {
    const prom = (res?.preguntas || []).flatMap((p) => (p.promedio != null ? [p.promedio] : p.filas?.map((f: any) => f.promedio).filter((x: any) => x != null) || []));
    return prom.length ? +(prom.reduce((a: number, b: number) => a + b, 0) / prom.length).toFixed(2) : null;
  }, [res]);

  const exportar = async () => {
    setExportando(true);
    try { await descargarExcel(id!, enc!.slug || 'encuesta'); } catch (e: any) { setError(e.message); } finally { setExportando(false); }
  };
  const borrar = async (rid: string) => {
    if (!confirm('¿Eliminar esta respuesta?')) return;
    await api(`/encuestas/respuesta/${rid}`, { method: 'DELETE' });
    setFilas((f) => f.filter((x) => x.id !== rid));
    api<Resumen>(`/encuestas/${id}/resumen`).then(setRes);
  };

  if (error) return <p className="error banner">{error}</p>;
  if (!enc || !res) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <>
      <Link to="/respuestas" className="back"><ArrowLeft size={16} /> Todas las encuestas</Link>
      <div className="page-head">
        <div><h1>{enc.titulo}</h1><p className="muted">/s/{enc.slug}</p></div>
        <button className="btn primary" disabled={exportando || res.total === 0} onClick={exportar}>{exportando ? 'Generando…' : <><FileSpreadsheet size={18} /> Exportar a Excel</>}</button>
      </div>

      <div className="kpis">
        <div className="card kpi"><b>{res.total}</b><span>respuestas</span></div>
        <div className="card kpi"><b style={{ color: general ? colorValor(general) : undefined }}>{general ?? '-'}</b><span>satisfacción promedio / 10</span></div>
        <div className="card kpi"><b>{filas[0] ? fmtFecha(filas[0].creadoEn) : '-'}</b><span>última respuesta</span></div>
      </div>

      <div className="tabs">
        <button className={tab === 'analisis' ? 'on' : ''} onClick={() => setTab('analisis')}><BarChart3 size={16} /> Análisis por pregunta</button>
        <button className={tab === 'respuestas' ? 'on' : ''} onClick={() => setTab('respuestas')}><Table2 size={16} /> Respuestas ({filas.length})</button>
      </div>

      {tab === 'analisis' && res.preguntas.map((r, i) => (
        <div className="card sec" key={r.id}>
          <p className="contador">Pregunta {i + 1} · {r.total} {r.total === 1 ? 'respuesta' : 'respuestas'}</p>
          <h3>{r.texto}</h3>
          <Grafico r={r} />
        </div>
      ))}

      {tab === 'respuestas' && (
        filas.length === 0 ? <div className="vacio"><div className="big icono-grande"><Inbox size={52} strokeWidth={1.5} /></div><h3>Aún no hay respuestas</h3><p className="muted">Comparte el enlace /s/{enc.slug} con tus clientes.</p></div> : (
          <div className="card tabla-wrap">
            <table className="tabla">
              <thead><tr>
                <th>Fecha</th>
                {enc.camposCliente.map((c) => <th key={c.id}>{c.etiqueta}</th>)}
                {enc.preguntas.map((p) => <th key={p.id}>{p.texto}</th>)}
                <th />
              </tr></thead>
              <tbody>
                {filas.slice(0, pag * POR_PAGINA).map((f) => (
                  <tr key={f.id}>
                    <td className="nowrap">{fmtFecha(f.creadoEn)}</td>
                    {enc.camposCliente.map((c) => <td key={c.id}>{f.respondiente?.[c.id] || ''}</td>)}
                    {enc.preguntas.map((p) => <td key={p.id}>{celda(p, f.respuestas?.[p.id], f.respuestas?.[claveComentario(p.id)])}</td>)}
                    <td><button className="btn sm ghost danger" onClick={() => borrar(f.id)} aria-label="Eliminar"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filas.length > pag * POR_PAGINA && <div className="center"><button className="btn" onClick={() => setPag((p) => p + 1)}>Ver más ({filas.length - pag * POR_PAGINA} restantes)</button></div>}
          </div>
        )
      )}
    </>
  );
}
