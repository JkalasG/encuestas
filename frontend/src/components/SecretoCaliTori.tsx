import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { CheckCircle2, Circle, Heart, LockOpen, Sparkles, Star, Smile, X } from 'lucide-react';
import { api } from '../api';
import type { Encuesta, Seguimiento } from '../types';

/**
 * MÓDULO INDEPENDIENTE (EASTER EGG ROMÁNTICO - CALITORI)
 * -----------------------------------------------------
 * Controlado por variable de entorno:
 *   - frontend/.env -> VITE_MODO_ESPECIAL=true
 *   - backend/.env  -> MODO_ESPECIAL=true
 *
 * Para desactivarlo: cambia VITE_MODO_ESPECIAL=false o MODO_ESPECIAL=false.
 * Para eliminarlo definitivamente: borra este archivo y quita <SecretoCaliTori ... /> de Editor.tsx.
 */

const SUGERIDOS_AMOR_ESTRELLAS: Record<string, Seguimiento> = {
  '2': {
    mensaje: '¡Oye! ¿Cómo que 1 estrella? 😂 Igual te amo con locura mi Catalina hermosa ❤️',
    comentario: true,
  },
  '4': {
    mensaje: '¿Solo 2 estrellitas para tu Toribio? 🥺 Compénsame con un besito aquí abajo...',
    comentario: true,
  },
  '6': {
    mensaje: '3 estrellas... ¡Acepto quejas solo si me regalas una de esas sonrisitas tuyas que tanto me gustan! 😘',
    comentario: true,
  },
  '8': {
    mensaje: '¡4 estrellas! Casi perfecto, aunque la única perfecta del mundo eres tú mi amor 🥰',
    comentario: true,
  },
  '10': {
    mensaje: '¡5 Estrellas! 🌟 Para mí tú vales un millón de estrellas, te amo con todo mi corazón ❤️',
    comentario: true,
  },
};

const SUGERIDOS_AMOR_CARITAS: Record<string, Seguimiento> = {
  '2': {
    mensaje: '¡No pongas esa carita enojada que hasta enojadita te ves preciosa! 😂❤️',
    comentario: true,
  },
  '4': {
    mensaje: 'Sé lo duro que la estás pasando con tus dolores y malestar, pero aquí está tu Toribio para cuidarte siempre 🥺❤️',
    comentario: true,
  },
  '6': {
    mensaje: '¡Cambia esa carita seria por una de esas sonrisitas tuyas que me vuelven loco! 😊✨',
    comentario: true,
  },
  '8': {
    mensaje: '¡Esa misma! Esa es la sonrisita hermosa que tanto me gusta y que ilumina todo mi día 🥰',
    comentario: true,
  },
  '10': {
    mensaje: '¡Con esos ojitos de amor te miro yo todos los días en el trabajo! Te amo mi Catalina 😍❤️',
    comentario: true,
  },
};

const SUGERIDOS_AMOR_ESCALA: Record<string, Seguimiento> = {
  bajo: {
    mensaje: '¡Del 1 al 10 yo a ti te doy un INFINITO porque me encantas demasiado! ❤️',
    comentario: true,
  },
  medio: {
    mensaje: '¡Súbele al 10 mi amor, que tu Toribio muere por esa sonrisita tuya! 😘',
    comentario: true,
  },
  alto: {
    mensaje: '¡10 de 10! Como tú y como nuestro amor para toda la vida ❤️',
    comentario: true,
  },
};

export default function SecretoCaliTori({
  enc,
  setEnc,
}: {
  enc: Encuesta;
  setEnc?: Dispatch<SetStateAction<Encuesta>>;
}) {
  // 1. Candado estricto de variables de entorno:
  //    Debe ser explícitamente 'true' tanto en frontend/.env como en backend/.env
  const envFrontend = import.meta.env.VITE_MODO_ESPECIAL === 'true';
  const [activoBackend, setActivoBackend] = useState<boolean>(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [yaMostradoAuto, setYaMostradoAuto] = useState(false);

  useEffect(() => {
    if (!envFrontend) {
      setActivoBackend(false);
      return;
    }
    api<{ modoEspecial?: boolean }>('/auth/config')
      .then((cfg) => {
        setActivoBackend(cfg?.modoEspecial === true);
      })
      .catch(() => {
        setActivoBackend(false);
      });
  }, [envFrontend]);

  // Paso 1: El título debe ser exactamente "prueba26122025" (ignorando mayúsculas/espacios extremos)
  const tituloLimpio = (enc.titulo || '').trim().toLowerCase();
  const paso1Ok = envFrontend && activoBackend && tituloLimpio === 'prueba26122025';

  // Paso 2: Requiere Paso 1 + Pregunta de Estrellas con "Usar sugeridos" (o seguimiento activo)
  const pregEstrellas = enc.preguntas.find((p) => p.tipo === 'estrellas');
  const tieneEstrellas = Boolean(pregEstrellas);
  const tieneSeguimientoEstrellas = Boolean(
    pregEstrellas?.seguimiento &&
      Object.values(pregEstrellas.seguimiento).some(
        (s) => s.comentario || (s.mensaje && s.mensaje.trim().length > 0)
      )
  );
  const paso2Ok = paso1Ok && tieneEstrellas && tieneSeguimientoEstrellas;

  // Paso 3: Requiere Paso 2 + Pregunta de Caritas con "Usar sugeridos" (o escribir "sonrisita")
  const pregCaritas = enc.preguntas.find((p) => p.tipo === 'caritas');
  const tieneCaritas = Boolean(pregCaritas);
  const tieneSeguimientoCaritas = Boolean(
    pregCaritas?.seguimiento &&
      Object.values(pregCaritas.seguimiento).some(
        (s) => s.comentario || (s.mensaje && s.mensaje.trim().length > 0)
      )
  );
  const textoCaritasSonrisa = Boolean(
    pregCaritas && /sonris/i.test(pregCaritas.texto || '')
  );
  const paso3Ok = paso2Ok && tieneCaritas && (tieneSeguimientoCaritas || textoCaritasSonrisa);

  // Paso 4: Requiere Paso 3 + Escribir la palabra exacta "patito" o "cuack"
  const todoElTexto = [
    enc.descripcion || '',
    enc.mensajeFinal || '',
    ...enc.preguntas.map((p) => `${p.texto} ${(p.opciones || []).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();
  const paso4Ok = paso3Ok && (/\bpatito\b/i.test(todoElTexto) || /\bcuack\b/i.test(todoElTexto));

  const todosCompletos = paso1Ok && paso2Ok && paso3Ok && paso4Ok;

  // Interceptar "Usar sugeridos" ÚNICAMENTE cuando el candado de entorno y el Paso 1 ("prueba26122025") están activos
  useEffect(() => {
    if (!paso1Ok || !setEnc) return;

    let huboCambio = false;
    const nuevasPreguntas = enc.preguntas.map((p) => {
      const seg = p.seguimiento;
      let pMod = p;

      // Si presionó "Usar sugeridos" en Estrellas (detectamos el texto por defecto)
      if (
        p.tipo === 'estrellas' &&
        seg &&
        seg['2']?.mensaje?.startsWith('Lamentamos tu experiencia')
      ) {
        huboCambio = true;
        pMod = {
          ...pMod,
          texto: pMod.texto.trim() || '¿Cuántas estrellas le das a tu Toribio que te ama con locura? ⭐',
          seguimiento: SUGERIDOS_AMOR_ESTRELLAS,
        };
      }

      // Si presionó "Usar sugeridos" en Caritas
      if (
        p.tipo === 'caritas' &&
        seg &&
        seg['2']?.mensaje?.startsWith('Lamentamos mucho tu experiencia')
      ) {
        huboCambio = true;
        pMod = {
          ...pMod,
          texto:
            pMod.texto.trim() ||
            '¿Sabías que hice todo esto solo para sacarte una de esas sonrisitas que tanto me gustan? 😍',
          seguimiento: SUGERIDOS_AMOR_CARITAS,
        };
      }

      // Si presionó "Usar sugeridos" en Escala
      if (
        p.tipo === 'escala' &&
        seg &&
        seg['bajo']?.mensaje?.startsWith('¿Qué podemos mejorar')
      ) {
        huboCambio = true;
        pMod = {
          ...pMod,
          seguimiento: SUGERIDOS_AMOR_ESCALA,
        };
      }

      // Solo si ya cumplió los pasos 1, 2 y 3 y escribe "patito" o "cuack" en Opción única
      const txtLower = (pMod.texto || '').toLowerCase();
      if (
        paso3Ok &&
        (/\bpatito\b/i.test(txtLower) || /\bcuack\b/i.test(txtLower)) &&
        pMod.tipo === 'unica' &&
        pMod.opciones &&
        pMod.opciones[0] === 'Opción 1'
      ) {
        huboCambio = true;
        pMod = {
          ...pMod,
          opciones: [
            'Apoyarnos y cuidarnos el uno al otro hasta el final ❤️',
            'Regalarte esa sonrisita que tanto te gusta 😍',
            '¡Cuack! 👶🐥 Apurarnos a hacer el patito jajaja',
          ],
        };
      }

      return pMod;
    });

    if (huboCambio) {
      setEnc((prev) => ({ ...prev, preguntas: nuevasPreguntas }));
    }
  }, [paso1Ok, paso3Ok, enc.preguntas, setEnc]);

  useEffect(() => {
    if (!envFrontend || !activoBackend) return;
    if (todosCompletos && !yaMostradoAuto) {
      const timer = setTimeout(() => {
        setModalAbierto(true);
        setYaMostradoAuto(true);
      }, 2200);
      return () => clearTimeout(timer);
    }
    if (!paso1Ok && yaMostradoAuto) {
      setYaMostradoAuto(false);
      setModalAbierto(false);
    }
  }, [envFrontend, activoBackend, todosCompletos, paso1Ok, yaMostradoAuto]);

  // Si está apagado por variable de entorno o mientras no escriba "prueba26122025", permanece 100% oculto
  if (!envFrontend || !activoBackend || !paso1Ok) return null;

  const completadosCount = [paso1Ok, paso2Ok, paso3Ok, paso4Ok].filter(Boolean).length;

  return (
    <>
      <style>{`
        .ct-secreto-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9990;
          width: 380px;
          max-width: calc(100vw - 28px);
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          background: linear-gradient(145deg, #fff5f7 0%, #ffffff 55%, #fdf2f8 100%);
          border: 2px solid #f472b6;
          border-radius: 22px;
          box-shadow: 0 22px 48px rgba(219, 39, 119, 0.25), 0 0 0 4px rgba(244, 114, 182, 0.16);
          padding: 18px;
          color: #831843;
          animation: ctSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: inherit;
        }
        @keyframes ctSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ct-secreto-head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .ct-secreto-ico {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          background: linear-gradient(135deg, #ec4899, #be185d);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 6px 14px rgba(219, 39, 119, 0.3);
          animation: ctPulseHeart 1.8s infinite ease-in-out;
        }
        @keyframes ctPulseHeart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .ct-secreto-title b {
          display: block;
          font-size: 0.98rem;
          color: #9d174d;
        }
        .ct-secreto-title small {
          font-size: 0.78rem;
          color: #be185d;
          opacity: 0.9;
        }
        .ct-progreso-bar {
          height: 7px;
          background: #fce7f3;
          border-radius: 999px;
          overflow: hidden;
          margin: 10px 0 14px;
        }
        .ct-progreso-fill {
          height: 100%;
          background: linear-gradient(90deg, #ec4899, #f43f5e, #fbbf24);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .ct-pasos-lista {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 14px;
        }
        .ct-paso-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #fbcfe8;
          font-size: 0.82rem;
          line-height: 1.38;
          transition: all 0.25s ease;
        }
        .ct-paso-item.ok {
          background: #fdf2f8;
          border-color: #f472b6;
          color: #9d174d;
        }
        .ct-paso-item.activo {
          border-color: #ec4899;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
          background: #fff;
        }
        .ct-paso-check {
          margin-top: 1px;
          flex-shrink: 0;
          color: #ec4899;
        }
        .ct-paso-texto b {
          display: block;
          margin-bottom: 2px;
          color: #831843;
        }
        .ct-paso-texto span {
          color: #9d174d;
          opacity: 0.92;
        }
        .ct-mini-recompensa {
          margin-top: 6px;
          padding: 6px 10px;
          border-radius: 9px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          font-weight: 600;
          font-size: 0.78rem;
          border: 1px solid #fcd34d;
          animation: ctFadeIn 0.35s ease;
        }
        .ct-btn-abrir {
          width: 100%;
          border: none;
          border-radius: 13px;
          padding: 12px 16px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
          color: #fff;
          box-shadow: 0 8px 20px rgba(225, 29, 72, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ct-btn-abrir:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(225, 29, 72, 0.4);
        }

        /* Modal Romántico a Pantalla Completa */
        .ct-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: radial-gradient(circle at top, rgba(131, 24, 67, 0.88), rgba(15, 23, 42, 0.94));
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
          animation: ctFadeIn 0.4s ease;
        }
        @keyframes ctFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ct-corazones-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .ct-corazones-bg span {
          position: absolute;
          bottom: -40px;
          font-size: 24px;
          opacity: 0.4;
          animation: ctFloatUp 10s linear infinite;
        }
        .ct-corazones-bg span:nth-child(1) { left: 7%; animation-duration: 9s; animation-delay: -2s; font-size: 24px; }
        .ct-corazones-bg span:nth-child(2) { left: 20%; animation-duration: 12s; animation-delay: -6s; font-size: 30px; }
        .ct-corazones-bg span:nth-child(3) { left: 35%; animation-duration: 8.5s; animation-delay: -4s; font-size: 22px; }
        .ct-corazones-bg span:nth-child(4) { left: 50%; animation-duration: 11s; animation-delay: -1s; font-size: 28px; }
        .ct-corazones-bg span:nth-child(5) { left: 66%; animation-duration: 9.5s; animation-delay: -5s; font-size: 26px; }
        .ct-corazones-bg span:nth-child(6) { left: 80%; animation-duration: 13s; animation-delay: -8s; font-size: 32px; }
        .ct-corazones-bg span:nth-child(7) { left: 91%; animation-duration: 10s; animation-delay: -3s; font-size: 22px; }
        @keyframes ctFloatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.5; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-105vh) rotate(25deg); opacity: 0; }
        }

        .ct-carta-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 650px;
          background: linear-gradient(180deg, #ffffff 0%, #fff5f8 100%);
          border: 2px solid #fbcfe8;
          border-radius: 28px;
          padding: 34px 32px 28px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 40px rgba(236, 72, 153, 0.35);
          color: #1f2937;
          text-align: center;
          animation: ctPopCarta 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          max-height: 92vh;
          overflow-y: auto;
        }
        @keyframes ctPopCarta {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .ct-carta-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid #fbcfe8;
          background: #fff;
          color: #9d174d;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .ct-carta-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          background: #fce7f3;
          color: #be185d;
          font-weight: 700;
          font-size: 0.82rem;
          margin-bottom: 12px;
          border: 1px solid #f9a8d4;
        }
        .ct-carta-heart-main {
          width: 66px;
          height: 66px;
          border-radius: 22px;
          margin: 0 auto 12px;
          background: linear-gradient(135deg, #ec4899, #e11d48);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 28px rgba(225, 29, 72, 0.35);
          animation: ctPulseHeart 1.8s infinite ease-in-out;
        }
        .ct-carta-card h2 {
          margin: 0 0 6px;
          font-size: 1.7rem;
          color: #831843;
          letter-spacing: -0.02em;
        }
        .ct-carta-sub {
          margin: 0 0 18px;
          color: #be185d;
          font-size: 0.94rem;
          font-weight: 500;
        }
        .ct-carta-cuerpo {
          text-align: left;
          background: #ffffff;
          border: 1px solid #fce7f3;
          border-radius: 20px;
          padding: 20px 22px;
          box-shadow: inset 0 2px 10px rgba(244, 114, 182, 0.06);
          font-size: 0.95rem;
          line-height: 1.62;
          color: #374151;
          margin-bottom: 18px;
        }
        .ct-carta-cuerpo p {
          margin: 0 0 13px;
        }
        .ct-carta-cuerpo p:last-child {
          margin-bottom: 0;
        }
        .ct-secreto-nombre-box {
          background: linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%);
          border: 1.5px dashed #f472b6;
          border-radius: 16px;
          padding: 14px 16px;
          margin: 14px 0;
          text-align: center;
        }
        .ct-secreto-nombre-box .ct-falso {
          font-size: 0.82rem;
          color: #4b5563;
          margin-bottom: 8px;
        }
        .ct-secreto-nombre-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin: 8px 0;
        }
        .ct-pill-amor {
          background: #fff;
          border: 1px solid #f9a8d4;
          padding: 6px 14px;
          border-radius: 12px;
          font-weight: 700;
          color: #9d174d;
          font-size: 0.92rem;
          box-shadow: 0 2px 6px rgba(236, 72, 153, 0.1);
        }
        .ct-pill-amor em {
          font-style: normal;
          color: #e11d48;
          text-decoration: underline;
        }
        .ct-patito-box {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
          border: 1.5px solid #facc15;
          border-radius: 16px;
          padding: 13px 16px;
          margin: 14px 0;
          color: #713f12;
        }
        .ct-patito-ico {
          font-size: 2.2rem;
          line-height: 1;
          flex-shrink: 0;
          animation: ctWiggle 1.4s infinite ease-in-out;
        }
        @keyframes ctWiggle {
          0%, 100% { transform: rotate(-6deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.1); }
        }
        .ct-carta-firma {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 4px;
        }
        .ct-carta-firma-txt {
          text-align: left;
        }
        .ct-carta-firma-txt span {
          display: block;
          font-size: 0.82rem;
          color: #9ca3af;
        }
        .ct-carta-firma-txt b {
          font-size: 1.05rem;
          color: #831843;
        }
        @media (max-width: 600px) {
          .ct-carta-card {
            padding: 24px 16px 20px;
          }
          .ct-carta-cuerpo {
            padding: 15px;
            font-size: 0.9rem;
          }
        }
      `}</style>

      {/* Tarjeta flotante de 4 pasos románticos en la esquina */}
      <div className="ct-secreto-widget" role="region" aria-label="Misión especial CaliTori">
        <div className="ct-secreto-head">
          <div className="ct-secreto-ico">
            <Heart size={20} fill="currentColor" />
          </div>
          <div className="ct-secreto-title">
            <b>¡Hola mi amor, Catalina! ❤️</b>
            <small>Código 26/12/2025 activado ({completadosCount}/4 pasos)</small>
          </div>
        </div>

        <div className="ct-progreso-bar">
          <div className="ct-progreso-fill" style={{ width: `${(completadosCount / 4) * 100}%` }} />
        </div>

        <div className="ct-pasos-lista">
          {/* PASO 1 */}
          <div className={`ct-paso-item ${paso1Ok ? 'ok' : 'activo'}`}>
            <span className="ct-paso-check">
              {paso1Ok ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </span>
            <div className="ct-paso-texto">
              <b>Paso 1: Nuestra fecha (26/12/2025)</b>
              <span>Poner <code>prueba26122025</code> (el día que me declaré a ti ❤️).</span>
            </div>
          </div>

          {/* PASO 2 */}
          <div className={`ct-paso-item ${paso2Ok ? 'ok' : !paso2Ok ? 'activo' : ''}`}>
            <span className="ct-paso-check">
              {paso2Ok ? <CheckCircle2 size={18} /> : <Star size={18} />}
            </span>
            <div className="ct-paso-texto">
              <b>Paso 2: Estrellas con comentarios de amor</b>
              <span>
                {!tieneEstrellas
                  ? 'Agrega una pregunta de "Estrellas" aquí abajo.'
                  : !paso2Ok
                  ? '¡Ahora abre "Mensajes según la respuesta" en esa pregunta de Estrellas y dale clic a "Usar sugeridos" (mira qué mensajes se ponen solos 👀)!'
                  : '¡Viste los mensajes sugeridos! Para mí eres un millón de estrellas 🌟.'}
              </span>
            </div>
          </div>

          {/* PASO 3 */}
          <div className={`ct-paso-item ${paso3Ok ? 'ok' : paso2Ok && !paso3Ok ? 'activo' : ''}`}>
            <span className="ct-paso-check">
              {paso3Ok ? <CheckCircle2 size={18} /> : <Smile size={18} />}
            </span>
            <div className="ct-paso-texto">
              <b>Paso 3: Esa sonrisita que tanto me gusta 😍</b>
              <span>
                {!tieneCaritas
                  ? 'Agrega una pregunta de "Caritas", porque quiero sacarte una de esas sonrisitas tuyas que tanto me enamoran.'
                  : !paso3Ok
                  ? '¡Dale clic también a "Usar sugeridos" dentro de la pregunta de Caritas (o escribe "sonrisita" en la pregunta)!'
                  : '¡Misión cumplida! Ya me imagino esa sonrisita hermosa en tu carita ahora mismo 🥰.'}
              </span>
            </div>
          </div>

          {/* PASO 4 */}
          <div className={`ct-paso-item ${paso4Ok ? 'ok' : paso3Ok && !paso4Ok ? 'activo' : ''}`}>
            <span className="ct-paso-check">
              {paso4Ok ? <CheckCircle2 size={18} /> : <Heart size={18} />}
            </span>
            <div className="ct-paso-texto">
              <b>Paso 4: La palabra secreta final</b>
              <span>
                {!paso4Ok
                  ? 'Agrega una pregunta de "Opción única" (o ve a "Mensaje al terminar") y escribe la palabra "patito"...'
                  : '¡Listo mi amor! Abriendo tu sorpresa especial... ❤️'}
              </span>
            </div>
          </div>
        </div>

        {todosCompletos ? (
          <button type="button" className="ct-btn-abrir" onClick={() => setModalAbierto(true)}>
            <LockOpen size={17} /> Abrir mi carta secreta para ti ❤️
          </button>
        ) : (
          <div style={{ fontSize: '0.78rem', textAlign: 'center', color: '#be185d', fontWeight: 600 }}>
            <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Completa {4 - completadosCount === 1 ? 'el último paso' : `los ${4 - completadosCount} pasos restantes`} para abrir tu sorpresa
          </div>
        )}
      </div>

      {/* Modal con la Carta Romántica Final */}
      {modalAbierto && todosCompletos && (
        <div className="ct-modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="ct-corazones-bg" aria-hidden="true">
            <span>❤️</span>
            <span>💖</span>
            <span>💕</span>
            <span>💗</span>
            <span>💘</span>
            <span>💖</span>
            <span>❤️</span>
          </div>

          <div className="ct-carta-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ct-carta-close"
              onClick={() => setModalAbierto(false)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="ct-carta-badge">
              <Sparkles size={14} /> 26 de Diciembre de 2025 · Nuestro Día Especial
            </div>

            <div className="ct-carta-heart-main">
              <Heart size={34} fill="currentColor" />
            </div>

            <h2>Para mi amorcito, Catalina ❤️</h2>
            <p className="ct-carta-sub">
              Hice todo este caminito secreto solo para hacerte feliz!! ❤️
            </p>

            <div className="ct-carta-cuerpo">
              <p>
                <b>Mi amor:</b> Cuando me pediste este sistema de encuestas, quise programarlo con todo mi amor
                porque sabía que era para ti. Cada pantalla, cada detalle y cada color lo hice pensando en ti.
              </p>

              <p>
                Aunque trabajemos en el mismo lugar y tengamos que portarnos serios en la oficina, la verdad es que{' '}
                <b>pienso en ti todo el tiempo, incluso mientras estoy trabajando</b>. Eres lo más importante para mí,
                y mi parte favorita del día es verte y lograr sacarte <b>una de esas sonrisitas tuyas que tanto me
                gustan y me enamoran</b>. 🥰
              </p>

              <div className="ct-patito-box" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', borderColor: '#fda4af', color: '#881337' }}>
                <span className="ct-patito-ico">❤️</span>
                <div style={{ fontSize: '0.92rem', lineHeight: 1.5 }}>
                  <b>Siempre contigo, cuidándonos el uno al otro:</b>
                  <br />
                  Sé lo duro que la estás pasando últimamente con tus dolores y tu malestar, mi vida. Quiero que
                  recuerdes siempre que no estás sola: <b>quiero apoyarte en todo, que estemos juntos hasta el final
                  y siempre cuidándonos el uno al otro</b>.
                </div>
              </div>

              <div className="ct-secreto-nombre-box">
                <div className="ct-falso">
                  🤫 <b>El verdadero secreto del nombre del sistema:</b>
                  <br />
                  Para que nadie en el trabajo sospeche, todos creen que <b>CaliTori</b> es por{' '}
                  <i>“Calidad...”</i>, pero en realidad lleva nuestros nombres escondidos:
                </div>
                <div className="ct-secreto-nombre-pills">
                  <span className="ct-pill-amor">
                    <em>Cali</em> = de <b>Ca</b>ta<b>li</b>na (tú, mi vida ❤️)
                  </span>
                  <span style={{ color: '#ec4899', fontWeight: 800 }}>+</span>
                  <span className="ct-pill-amor">
                    <em>Tori</em> = de <b>Tori</b>bio (como me dices tú 🥰)
                  </span>
                </div>
                <div style={{ fontSize: '0.83rem', color: '#9d174d', fontWeight: 600, marginTop: 6 }}>
                  ¡Así nuestro amor está presente todos los días sin que nadie se dé cuenta!
                </div>
              </div>

              <p>
                Gracias por aquel <b>26/12/2025</b> en que me declaré a ti, por ser mi novia hermosa y mi persona
                favorita en el mundo. <b>Te amo con todo mi corazón.</b>
              </p>
            </div>

            <div className="ct-carta-firma">
              <div className="ct-carta-firma-txt">
                <span>Con todo mi amor, hoy y siempre:</span>
                <b>Tu Toribio ❤️</b>
              </div>
              <button
                type="button"
                className="ct-btn-abrir"
                style={{ width: 'auto', padding: '10px 22px' }}
                onClick={() => setModalAbierto(false)}
              >
                <Heart size={16} fill="currentColor" /> Te amo demasiado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
