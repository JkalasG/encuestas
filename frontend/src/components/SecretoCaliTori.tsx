import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Gift,
  Heart,
  Maximize2,
  Minimize2,
  Sparkles,
  Star,
  Smile,
  X,
} from 'lucide-react';
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
    mensaje: '¿1 estrella? 😂 Igual te amo mi Catalina hermosa ❤️',
    comentario: true,
  },
  '4': {
    mensaje: '¿Solo 2 estrellitas? 🥺 Dame un besito aquí abajo...',
    comentario: true,
  },
  '6': {
    mensaje: '¡Acepto quejas solo con esa sonrisita tuya! 😘',
    comentario: true,
  },
  '8': {
    mensaje: '¡4 estrellas! Aunque la única perfecta eres tú 🥰',
    comentario: true,
  },
  '10': {
    mensaje: '¡5 Estrellas! 🌟 Para mí tú vales un millón, te amo ❤️',
    comentario: true,
  },
};

const SUGERIDOS_AMOR_CARITAS: Record<string, Seguimiento> = {
  '2': {
    mensaje: '¡Hasta enojadita te ves preciosa mi amor! 😂❤️',
    comentario: true,
  },
  '4': {
    mensaje: 'Sé de tus dolores, aquí estoy para cuidarte siempre 🥺❤️',
    comentario: true,
  },
  '6': {
    mensaje: '¡Cambia esa carita por la sonrisita que me encanta! 😊✨',
    comentario: true,
  },
  '8': {
    mensaje: '¡Esa es la sonrisita hermosa que ilumina mi día! 🥰',
    comentario: true,
  },
  '10': {
    mensaje: '¡Con esos ojitos de amor te miro en el trabajo! 😍❤️',
    comentario: true,
  },
};

const SUGERIDOS_AMOR_ESCALA: Record<string, Seguimiento> = {
  bajo: {
    mensaje: '¡Del 1 al 10 yo a ti te doy un INFINITO! ❤️',
    comentario: true,
  },
  medio: {
    mensaje: '¡Súbele al 10 mi amor, muero por tu sonrisita! 😘',
    comentario: true,
  },
  alto: {
    mensaje: '¡10 de 10! Como tú y nuestro amor para siempre ❤️',
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
  const [minimizado, setMinimizado] = useState<boolean>(false);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);

  const paso1Ref = useRef<HTMLDivElement | null>(null);
  const paso2Ref = useRef<HTMLDivElement | null>(null);
  const paso3Ref = useRef<HTMLDivElement | null>(null);
  const paso4Ref = useRef<HTMLDivElement | null>(null);
  const premioFloatingRef = useRef<HTMLButtonElement | null>(null);
  const premioInlineRef = useRef<HTMLDivElement | null>(null);

  const prevStateRef = useRef({
    paso1Ok: false,
    tieneEstrellas: false,
    paso2Ok: false,
    tieneCaritas: false,
    paso3Ok: false,
    tieneUnica: false,
    paso4Ok: false,
  });

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

  // Paso 4: Requiere Paso 3 + Pregunta de Opción única y escribir la palabra "patito" o "cuack"
  const pregUnica = [...enc.preguntas].reverse().find((p) => p.tipo === 'unica');
  const tieneUnica = Boolean(pregUnica);
  const todoElTexto = [
    enc.descripcion || '',
    enc.mensajeFinal || '',
    ...enc.preguntas.map((p) => `${p.texto} ${(p.opciones || []).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();
  const paso4Ok = paso3Ok && (/\bpatito\b/i.test(todoElTexto) || /\bcuack\b/i.test(todoElTexto));

  const todosCompletos = paso1Ok && paso2Ok && paso3Ok && paso4Ok;

  // Determinar cuál es el paso activo actual (1, 2, 3, 4 o 5 = Premio)
  const pasoActual = !paso1Ok ? 1 : !paso2Ok ? 2 : !paso3Ok ? 3 : !paso4Ok ? 4 : 5;

  // Función que hace focus tanto en la instrucción como en el elemento del editor correspondiente
  const enfocarElementoPaso = (paso: number) => {
    if (paso === 2) {
      if (!pregEstrellas) {
        const secAgregar = document.getElementById('sec-agregar-pregunta');
        secAgregar?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const card = document.getElementById(`pregunta-${pregEstrellas.id}`);
        if (card) {
          const details = card.querySelector('details.seg-editor') as HTMLDetailsElement | null;
          if (details && !details.open) details.open = true;
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const btnSug = card.querySelector('.seg-editor .row .btn') as HTMLButtonElement | null;
          setTimeout(() => btnSug?.focus(), 350);
        }
      }
    } else if (paso === 3) {
      if (!pregCaritas) {
        const secAgregar = document.getElementById('sec-agregar-pregunta');
        secAgregar?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const card = document.getElementById(`pregunta-${pregCaritas.id}`);
        if (card) {
          const details = card.querySelector('details.seg-editor') as HTMLDetailsElement | null;
          if (details && !details.open) details.open = true;
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const btnSug = card.querySelector('.seg-editor .row .btn') as HTMLButtonElement | null;
          setTimeout(() => btnSug?.focus(), 350);
        }
      }
    } else if (paso === 4) {
      if (!pregUnica) {
        const secAgregar = document.getElementById('sec-agregar-pregunta');
        secAgregar?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const input = document.getElementById(`input-pregunta-${pregUnica.id}`) as HTMLInputElement | null;
        if (input) {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => input.focus(), 350);
        }
      }
    } else if (paso === 5) {
      premioInlineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => premioFloatingRef.current?.focus(), 350);
    }
  };

  // Focus automático dentro de la tarjetita y en el editor conforme avanza cada instrucción
  useEffect(() => {
    const prev = prevStateRef.current;

    if (!paso1Ok) {
      prevStateRef.current = {
        paso1Ok: false,
        tieneEstrellas: false,
        paso2Ok: false,
        tieneCaritas: false,
        paso3Ok: false,
        tieneUnica: false,
        paso4Ok: false,
      };
      return;
    }

    // 1. Acaba de activar Paso 1 -> Hacer focus en Paso 2
    if (!prev.paso1Ok && paso1Ok) {
      setMinimizado(false);
      setTimeout(() => {
        paso2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        enfocarElementoPaso(2);
      }, 250);
    }
    // 2. Acaba de agregar pregunta de Estrellas -> Hacer focus en su sección de "Usar sugeridos"
    else if (!prev.tieneEstrellas && tieneEstrellas && !paso2Ok) {
      setTimeout(() => {
        paso2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        enfocarElementoPaso(2);
      }, 200);
    }
    // 3. Acaba de completar Paso 2 (Estrellas con sugeridos) -> Hacer focus en la instrucción del Paso 3
    else if (!prev.paso2Ok && paso2Ok) {
      setMinimizado(false);
      setTimeout(() => {
        paso3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
    }
    // 4. Acaba de agregar pregunta de Caritas -> Hacer focus en su sección de "Usar sugeridos"
    else if (!prev.tieneCaritas && tieneCaritas && paso2Ok && !paso3Ok) {
      setTimeout(() => {
        paso3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        enfocarElementoPaso(3);
      }, 200);
    }
    // 5. Acaba de completar Paso 3 (Caritas con sugeridos) -> Hacer focus en la instrucción del Paso 4
    else if (!prev.paso3Ok && paso3Ok) {
      setMinimizado(false);
      setTimeout(() => {
        paso4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
    }
    // 6. Acaba de agregar pregunta de Opción única en Paso 4 -> Hacer focus en el input para escribir "patito"
    else if (!prev.tieneUnica && tieneUnica && paso3Ok && !paso4Ok) {
      setTimeout(() => {
        paso4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        enfocarElementoPaso(4);
      }, 200);
    }
    // 7. Acaba de completar Paso 4 ("patito") -> Hacer focus en el botón Premio
    else if (!prev.paso4Ok && paso4Ok) {
      setMinimizado(false);
      setTimeout(() => {
        enfocarElementoPaso(5);
      }, 300);
    }

    prevStateRef.current = {
      paso1Ok,
      tieneEstrellas,
      paso2Ok,
      tieneCaritas,
      paso3Ok,
      tieneUnica,
      paso4Ok,
    };
  }, [paso1Ok, tieneEstrellas, paso2Ok, tieneCaritas, paso3Ok, tieneUnica, paso4Ok]);

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
    if (!paso1Ok) {
      setModalAbierto(false);
    }
  }, [paso1Ok]);

  // Si está apagado por variable de entorno o mientras no escriba "prueba26122025", permanece 100% oculto
  if (!envFrontend || !activoBackend || !paso1Ok) return null;

  const completadosCount = [paso1Ok, paso2Ok, paso3Ok, paso4Ok].filter(Boolean).length;

  const resumenPasoActual =
    pasoActual === 2
      ? !tieneEstrellas
        ? 'Paso 2: Agrega una pregunta de "Estrellas"'
        : 'Paso 2: Haz clic en "Usar sugeridos" en Estrellas ⭐'
      : pasoActual === 3
      ? !tieneCaritas
        ? 'Paso 3: Agrega una pregunta de "Caritas" 😊'
        : 'Paso 3: Haz clic en "Usar sugeridos" en Caritas 😍'
      : pasoActual === 4
      ? 'Paso 4: Agrega "Opción única" y escribe "patito" 🐥'
      : '¡Todo listo! Abre tu Premio ❤️';

  return (
    <>
      <style>{`
        /* Asegura que los mensajes de amor sugeridos se vean completos sin cortarse */
        .seg-fila {
          grid-template-columns: 120px 1fr auto !important;
        }
        .seg-fila .input {
          font-size: 0.88rem !important;
          padding: 8px 10px !important;
        }

        /* Tarjetita flotante de instrucciones con opción de Minimizar / Maximizar */
        .ct-floating-card {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 950;
          width: 390px;
          max-width: calc(100vw - 28px);
          background: linear-gradient(145deg, #fff5f7 0%, #ffffff 55%, #fdf2f8 100%);
          border: 2px solid #f472b6;
          border-radius: 22px;
          box-shadow: 0 20px 50px rgba(190, 24, 93, 0.28), 0 0 0 4px rgba(244, 114, 182, 0.16);
          padding: 16px 18px;
          color: #831843;
          animation: ctFloatIn 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: inherit;
          box-sizing: border-box;
          transition: all 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .ct-floating-card.minimizado {
          width: 340px;
          padding: 12px 15px;
          border-radius: 18px;
        }
        @keyframes ctFloatIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ct-secreto-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ct-secreto-ico {
          width: 38px;
          height: 38px;
          border-radius: 12px;
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
        .ct-secreto-title {
          flex: 1;
          min-width: 0;
        }
        .ct-secreto-title b {
          display: block;
          font-size: 0.96rem;
          color: #9d174d;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ct-secreto-title small {
          display: block;
          font-size: 0.78rem;
          color: #be185d;
          opacity: 0.92;
        }
        .ct-btn-minmax {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border: 1.5px solid #f9a8d4;
          background: #fff;
          color: #9d174d;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 10px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .ct-btn-minmax:hover {
          background: #fce7f3;
          border-color: #ec4899;
        }
        .ct-min-barra-activa {
          margin-top: 8px;
          padding: 8px 11px;
          border-radius: 11px;
          background: #fff;
          border: 1.5px solid #f472b6;
          font-size: 0.8rem;
          font-weight: 700;
          color: #9d174d;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          cursor: pointer;
        }
        .ct-progreso-bar {
          height: 7px;
          background: #fce7f3;
          border-radius: 999px;
          overflow: hidden;
          margin: 10px 0 12px;
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
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 2px;
        }
        .ct-paso-item {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 9px 11px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.78);
          border: 1.5px solid #fbcfe8;
          font-size: 0.82rem;
          line-height: 1.35;
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .ct-paso-item.ok {
          background: #fdf2f8;
          border-color: #f9a8d4;
          color: #9d174d;
          opacity: 0.78;
        }
        .ct-paso-item.activo-focus {
          background: #ffffff;
          border: 2px solid #ec4899;
          box-shadow: 0 6px 18px rgba(236, 72, 153, 0.22), 0 0 0 3px rgba(236, 72, 153, 0.14);
          transform: scale(1.01);
        }
        .ct-paso-item.pendiente {
          opacity: 0.58;
        }
        .ct-paso-badge-focus {
          display: inline-block;
          background: #ec4899;
          color: #fff;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 7px;
          border-radius: 99px;
          margin-left: 6px;
          vertical-align: middle;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .ct-paso-check {
          margin-top: 2px;
          flex-shrink: 0;
          color: #ec4899;
        }
        .ct-paso-texto {
          flex: 1;
        }
        .ct-paso-texto b {
          display: block;
          margin-bottom: 2px;
          color: #831843;
        }
        .ct-paso-texto span {
          color: #9d174d;
          opacity: 0.94;
        }
        .ct-ir-link {
          display: inline-block;
          margin-top: 4px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #e11d48;
          text-decoration: underline;
        }

        /* Caja final debajo de la última estructura con el botón Premio */
        .ct-premio-inline-box {
          margin: 18px 0 22px;
          padding: 20px 24px;
          border-radius: 20px;
          background: linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%);
          border: 2px solid #f472b6;
          box-shadow: 0 12px 32px rgba(225, 29, 72, 0.18);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          animation: ctFloatIn 0.4s ease;
        }
        .ct-btn-premio {
          border: none;
          border-radius: 16px;
          padding: 13px 32px;
          font-weight: 800;
          font-size: 1.05rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(135deg, #ec4899 0%, #e11d48 100%);
          color: #fff;
          box-shadow: 0 10px 26px rgba(225, 29, 72, 0.35);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          animation: ctPulseHeart 1.8s infinite ease-in-out;
        }
        .ct-btn-premio:hover, .ct-btn-premio:focus {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 14px 30px rgba(225, 29, 72, 0.48);
          outline: 3px solid rgba(244, 114, 182, 0.5);
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
          max-width: 660px;
          background: linear-gradient(180deg, #ffffff 0%, #fff5f8 100%);
          border: 2px solid #fbcfe8;
          border-radius: 28px;
          padding: 32px 30px 26px;
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
          margin-bottom: 10px;
          border: 1px solid #f9a8d4;
        }
        .ct-carta-heart-main {
          width: 62px;
          height: 62px;
          border-radius: 20px;
          margin: 0 auto 10px;
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
          font-size: 1.65rem;
          color: #831843;
          letter-spacing: -0.02em;
        }
        .ct-carta-sub {
          margin: 0 0 16px;
          color: #be185d;
          font-size: 0.95rem;
          font-weight: 600;
        }
        .ct-carta-cuerpo {
          text-align: left;
          background: #ffffff;
          border: 1px solid #fce7f3;
          border-radius: 20px;
          padding: 20px 22px;
          box-shadow: inset 0 2px 10px rgba(244, 114, 182, 0.06);
          font-size: 0.94rem;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 18px;
        }
        .ct-carta-cuerpo p {
          margin: 0 0 12px;
        }
        .ct-carta-cuerpo p:last-child {
          margin-bottom: 0;
        }
        .ct-secreto-nombre-box {
          background: linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%);
          border: 1.5px dashed #f472b6;
          border-radius: 16px;
          padding: 13px 16px;
          margin: 13px 0;
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
        .ct-apoyo-box {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
          border: 1.5px solid #fda4af;
          border-radius: 16px;
          padding: 13px 16px;
          margin: 13px 0;
          color: #881337;
        }
        .ct-apoyo-ico {
          font-size: 2rem;
          line-height: 1;
          flex-shrink: 0;
        }
        .ct-anoche-box {
          background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
          border: 1.5px solid #e879f9;
          border-radius: 16px;
          padding: 13px 16px;
          margin: 13px 0;
          color: #701a75;
          font-size: 0.92rem;
          line-height: 1.52;
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
          .ct-floating-card {
            right: 12px;
            left: 12px;
            bottom: 12px;
            width: auto;
          }
          .ct-floating-card.minimizado {
            width: auto;
          }
          .ct-carta-card {
            padding: 24px 16px 20px;
          }
          .ct-carta-cuerpo {
            padding: 15px;
            font-size: 0.9rem;
          }
        }
      `}</style>

      {/* Si ya completó los 4 pasos, también aparece abajo en la última estructura el botón Premio */}
      {todosCompletos && (
        <div ref={premioInlineRef} className="ct-premio-inline-box">
          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#9d174d' }}>
            🎉 ¡Completaste todos los pasos secretos, mi amor! ❤️
          </div>
          <div style={{ fontSize: '0.88rem', color: '#be185d' }}>
            Haz clic en el botón de abajo cuando estés lista para abrir tu sorpresa especial:
          </div>
          <button type="button" className="ct-btn-premio" onClick={() => setModalAbierto(true)}>
            <Gift size={22} /> Premio ❤️
          </button>
        </div>
      )}

      {/* Tarjetita Flotante de Instrucciones con botón de Minimizar y Maximizar */}
      <div
        className={`ct-floating-card ${minimizado ? 'minimizado' : ''}`}
        role="region"
        aria-label="Instrucciones secretas CaliTori"
      >
        <div className="ct-secreto-head">
          <div className="ct-secreto-ico">
            <Heart size={19} fill="currentColor" />
          </div>
          <div className="ct-secreto-title">
            <b>¡Hola mi amor, Catalina! ❤️</b>
            <small>
              Código 26/12/2025 ({completadosCount}/4 pasos listos)
            </small>
          </div>
          <button
            type="button"
            className="ct-btn-minmax"
            onClick={() => setMinimizado((m) => !m)}
            title={minimizado ? 'Maximizar instrucciones' : 'Minimizar para ver detrás'}
          >
            {minimizado ? (
              <>
                <Maximize2 size={14} /> Maximizar <ChevronUp size={14} />
              </>
            ) : (
              <>
                <Minimize2 size={14} /> Minimizar <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {minimizado ? (
          <div
            className="ct-min-barra-activa"
            onClick={() => {
              setMinimizado(false);
              enfocarElementoPaso(pasoActual);
            }}
            title="Haz clic para mostrar y enfocar este paso"
          >
            <span>👉 {resumenPasoActual}</span>
            {todosCompletos && (
              <button
                type="button"
                className="ct-btn-premio"
                style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalAbierto(true);
                }}
              >
                <Gift size={15} /> Premio ❤️
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="ct-progreso-bar">
              <div className="ct-progreso-fill" style={{ width: `${(completadosCount / 4) * 100}%` }} />
            </div>

            <div className="ct-pasos-lista">
              {/* PASO 1 */}
              <div
                ref={paso1Ref}
                className={`ct-paso-item ${paso1Ok ? 'ok' : 'activo-focus'}`}
              >
                <span className="ct-paso-check">
                  {paso1Ok ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                </span>
                <div className="ct-paso-texto">
                  <b>Paso 1: Nuestra fecha (26/12/2025)</b>
                  <span>Poner <code>prueba26122025</code> (el día que me declaré a ti ❤️).</span>
                </div>
              </div>

              {/* PASO 2 */}
              <div
                ref={paso2Ref}
                className={`ct-paso-item ${
                  paso2Ok ? 'ok' : pasoActual === 2 ? 'activo-focus' : 'pendiente'
                }`}
                onClick={() => enfocarElementoPaso(2)}
              >
                <span className="ct-paso-check">
                  {paso2Ok ? <CheckCircle2 size={18} /> : <Star size={18} />}
                </span>
                <div className="ct-paso-texto">
                  <b>
                    Paso 2: Estrellas con amor
                    {pasoActual === 2 && <span className="ct-paso-badge-focus">👉 Siguiente</span>}
                  </b>
                  <span>
                    {!tieneEstrellas
                      ? 'Agrega una pregunta de "Estrellas" aquí abajo.'
                      : !paso2Ok
                      ? 'Abre "Mensajes según la respuesta" en Estrellas y dale clic a "Usar sugeridos" 👀.'
                      : '¡Viste los mensajes sugeridos! Para mí eres un millón de estrellas 🌟.'}
                  </span>
                  {pasoActual === 2 && (
                    <div>
                      <span className="ct-ir-link">Haz clic aquí para enfocar este paso ↓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PASO 3 */}
              <div
                ref={paso3Ref}
                className={`ct-paso-item ${
                  paso3Ok ? 'ok' : pasoActual === 3 ? 'activo-focus' : 'pendiente'
                }`}
                onClick={() => enfocarElementoPaso(3)}
              >
                <span className="ct-paso-check">
                  {paso3Ok ? <CheckCircle2 size={18} /> : <Smile size={18} />}
                </span>
                <div className="ct-paso-texto">
                  <b>
                    Paso 3: Esa sonrisita que me encanta 😍
                    {pasoActual === 3 && <span className="ct-paso-badge-focus">👉 Siguiente</span>}
                  </b>
                  <span>
                    {!tieneCaritas
                      ? 'Agrega una pregunta de "Caritas" para sacarte esa sonrisita tuya que me enamora.'
                      : !paso3Ok
                      ? 'Dale clic también a "Usar sugeridos" dentro de la pregunta de Caritas.'
                      : '¡Misión cumplida! Ya me imagino esa sonrisita hermosa en tu carita 🥰.'}
                  </span>
                  {pasoActual === 3 && (
                    <div>
                      <span className="ct-ir-link">Haz clic aquí para enfocar este paso ↓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PASO 4 */}
              <div
                ref={paso4Ref}
                className={`ct-paso-item ${
                  paso4Ok ? 'ok' : pasoActual === 4 ? 'activo-focus' : 'pendiente'
                }`}
                onClick={() => enfocarElementoPaso(4)}
              >
                <span className="ct-paso-check">
                  {paso4Ok ? <CheckCircle2 size={18} /> : <Heart size={18} />}
                </span>
                <div className="ct-paso-texto">
                  <b>
                    Paso 4: La palabra secreta final
                    {pasoActual === 4 && <span className="ct-paso-badge-focus">👉 Siguiente</span>}
                  </b>
                  <span>
                    {!paso4Ok
                      ? 'Agrega una pregunta de "Opción única" y escribe la palabra "patito"...'
                      : '¡Completaste todos los pasos mi amor! Lee las opciones y abre tu premio 👇'}
                  </span>
                  {pasoActual === 4 && (
                    <div>
                      <span className="ct-ir-link">Haz clic aquí para enfocar este paso ↓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {todosCompletos && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button
                  ref={premioFloatingRef}
                  type="button"
                  className="ct-btn-premio"
                  style={{ width: '100%' }}
                  onClick={() => setModalAbierto(true)}
                >
                  <Gift size={20} /> Premio ❤️
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal con la Carta Romántica Final (solo se abre al hacer clic en el botón "Premio") */}
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
              <Heart size={32} fill="currentColor" />
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

              <div className="ct-anoche-box">
                🥺 <b>Perdóname por lo de anoche, mi amor:</b>
                <br />
                Anoche sé que estabas molesta porque no quería dormir… pero era porque quería terminar esto para
                mostrártelo apenas llegues a la oficina, ya que me hacía muchísima ilusión que empieces el día
                alegre y, si se puede, un poquito sonrojada 😊❤️.{' '}
                <b>No te enojes con Toribio, ¿sí amor? Confía más en mí :( ❤️</b>
              </div>

              <p>
                Aunque trabajemos en el mismo lugar y tengamos que portarnos serios en la oficina, la verdad es que{' '}
                <b>pienso en ti todo el tiempo, incluso mientras estoy trabajando</b>. Eres lo más importante para mí,
                y mi parte favorita del día es verte y lograr sacarte <b>una de esas sonrisitas tuyas que tanto me
                gustan y me enamoran</b>. 🥰
              </p>

              <div className="ct-apoyo-box">
                <span className="ct-apoyo-ico">❤️</span>
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

              <p style={{ textAlign: 'center', fontWeight: 700, color: '#be185d', marginTop: 14 }}>
                🐥 ¡Cuack! Y como pusiste la palabra secreta <u>patito</u>... ya sabes que tenemos que apurarnos a
                hacer el patito jajaja ❤️😂
              </p>
            </div>

            <div className="ct-carta-firma">
              <div className="ct-carta-firma-txt">
                <span>Con todo mi amor y mi vida entera,</span>
                <b>Tu Toribio que te ama muchísimo ❤️</b>
              </div>
              <button
                type="button"
                className="ct-btn-premio"
                style={{ width: 'auto', padding: '11px 22px', fontSize: '0.95rem' }}
                onClick={() => setModalAbierto(false)}
              >
                ¡Te amo Toribio! 😘❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
