import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastNotif {
  id: string;
  tipo?: 'error' | 'aviso' | 'exito' | 'info';
  titulo: string;
  mensaje: string;
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastNotif[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-pnotify-container" role="region" aria-live="polite" aria-label="Notificaciones">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastNotif; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4600);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const tipo = toast.tipo || 'error';
  const Icono = tipo === 'exito' ? CheckCircle2 : tipo === 'aviso' ? AlertTriangle : tipo === 'info' ? Info : AlertCircle;

  return (
    <div className={`toast-pnotify toast-${tipo}`} onClick={onDismiss} role="alert">
      <div className="toast-icon">
        <Icono size={22} />
      </div>
      <div className="toast-content">
        <strong className="toast-title">{toast.titulo}</strong>
        <p className="toast-msg">{toast.mensaje}</p>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
      <div className="toast-progress" />
    </div>
  );
}

