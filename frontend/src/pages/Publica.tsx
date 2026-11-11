import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleCheck, CirclePause, Hourglass, SearchX } from 'lucide-react';
import { api } from '../api';
import Runner from '../components/Runner';
import { generarVariablesTema, type EncuestaPublica } from '../types';

const ICONOS: Record<string, any> = { pausada: CirclePause, vencida: Hourglass, completa: CircleCheck };
const MENSAJES: Record<string, [string, string, string]> = {
  pausada: ['', 'Encuesta no disponible', 'Su creador la pausó temporalmente.'],
  vencida: ['', 'La encuesta ya cerró', 'Se pasó la fecha límite para responder.'],
  completa: ['', 'Encuesta completa', 'Ya se alcanzó el número máximo de respuestas.'],
};

export default function Publica() {
  const { slug } = useParams();
  const [enc, setEnc] = useState<EncuestaPublica | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<EncuestaPublica>(`/publico/${slug}`, { auth: false })
      .then((e) => { setEnc(e); document.title = e.titulo; })
      .catch((e) => setError(e.message));
  }, [slug]);

  const enviar = useCallback(
    async (payload: any) => { await api(`/publico/${slug}/responder`, { method: 'POST', body: payload, auth: false }); },
    [slug],
  );

  const tema = enc?.tema;
  const varsTema = generarVariablesTema(tema?.colorPrimario) as React.CSSProperties;
  const fondoClase = `tema-fondo-${tema?.fondo || 'degradado'}`;
  const bordesClase = `tema-bordes-${tema?.estiloBordes || 'redondeado'}`;
  const tarjetaClase = `tema-tarjeta-${tema?.estiloTarjeta || 'solido'}`;

  return (
    <div className={`publica ${fondoClase}`} style={varsTema}>
      {tema?.fondo === 'burbujas' && (
        <div className="burbujas-decorativas" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      )}
      <div className={`publica-card ${bordesClase} ${tarjetaClase}`}>
        {error && <div className="runner-msg"><div className="big icono-grande"><SearchX size={52} strokeWidth={1.5} /></div><h2>{error}</h2></div>}
        {!enc && !error && <div className="center-screen" style={{ minHeight: 240 }}><div className="spinner" /></div>}
        {enc && enc.estado !== 'abierta' && (
          <div className="runner-msg"><div className="big icono-grande">{(() => { const I = ICONOS[enc.estado]; return <I size={52} strokeWidth={1.5} />; })()}</div><h2>{MENSAJES[enc.estado][1]}</h2><p>{MENSAJES[enc.estado][2]}</p></div>
        )}
        {enc && enc.estado === 'abierta' && <Runner encuesta={enc} enviar={enviar} />}
      </div>
    </div>
  );
}
