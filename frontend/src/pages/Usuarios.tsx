import { useEffect, useState, type FormEvent } from 'react';
import { Plus, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { ToastContainer, type ToastNotif } from '../components/Toast';
import { uid } from '../types';

interface UsuarioItem {
  id: string;
  nombre: string;
  email: string;
  fecha: string;
}

export default function Usuarios() {
  const { usuario: actual } = useAuth();
  const [lista, setLista] = useState<UsuarioItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [toasts, setToasts] = useState<ToastNotif[]>([]);

  const notificar = (titulo: string, mensaje: string, tipo: 'error' | 'aviso' | 'exito' = 'error') => {
    setToasts((prev) => [...prev, { id: uid(), titulo, mensaje, tipo }]);
  };

  const quitarToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const cargar = () => {
    setCargando(true);
    api<UsuarioItem[]>('/auth/usuarios')
      .then(setLista)
      .catch((e) => notificar('Error', e.message || 'No se pudieron cargar los usuarios'))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      notificar('Dato requerido', 'Ingresa el nombre del usuario');
      return;
    }
    if (!form.email.trim()) {
      notificar('Dato requerido', 'Ingresa el correo electrónico');
      return;
    }
    if (form.password.length < 6) {
      notificar('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await api<UsuarioItem>('/auth/usuarios', { method: 'POST', body: form });
      setLista((prev) => [...prev, nuevo]);
      setForm({ nombre: '', email: '', password: '' });
      notificar('Cuenta creada', `Se creó el acceso para ${nuevo.email}`, 'exito');
    } catch (err: any) {
      notificar('No se pudo crear', err.message || 'Error al registrar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (u: UsuarioItem) => {
    if (u.id === actual?.id) {
      notificar('Acción no permitida', 'No puedes eliminar tu propia cuenta activa', 'aviso');
      return;
    }
    if (!confirm(`¿Seguro que deseas eliminar la cuenta de "${u.nombre}" (${u.email})?`)) return;
    try {
      await api(`/auth/usuarios/${u.id}`, { method: 'DELETE' });
      setLista((prev) => prev.filter((x) => x.id !== u.id));
      notificar('Usuario eliminado', `Se revocó el acceso de ${u.email}`, 'exito');
    } catch (err: any) {
      notificar('Error al eliminar', err.message);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={quitarToast} />

      <div className="page-head">
        <div>
          <h1>Usuarios Administradores</h1>
          <p className="muted">Solo los administradores con sesión activa pueden crear nuevas cuentas de acceso al sistema.</p>
        </div>
      </div>

      <div className="dos" style={{ alignItems: 'start' }}>
        <div className="card sec">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={19} /> Crear nueva cuenta
          </h3>
          <form onSubmit={crear} className="form-col">
            <label className="campo">
              <span>Nombre completo o cargo *</span>
              <input
                className="input"
                placeholder="Ej: Gestión de Calidad"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </label>
            <label className="campo">
              <span>Correo electrónico *</span>
              <input
                className="input"
                type="email"
                placeholder="usuario@agencia-vilaseca.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="campo">
              <span>Contraseña *</span>
              <input
                className="input"
                type="password"
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn primary" disabled={guardando}>
              <Plus size={17} /> {guardando ? 'Creando cuenta…' : 'Crear cuenta de acceso'}
            </button>
          </form>
        </div>

        <div className="card sec">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={19} /> Cuentas con acceso ({lista.length})
          </h3>
          {cargando ? (
            <div className="center" style={{ padding: 24 }}><div className="spinner" /></div>
          ) : (
            <div className="tabla-wrap">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th style={{ width: 90, textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((u) => {
                    const esActual = u.id === actual?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <b>{u.nombre}</b>
                          {esActual && (
                            <span className="pill ok" style={{ marginLeft: 8 }}>
                              <ShieldCheck size={12} /> Tú
                            </span>
                          )}
                        </td>
                        <td>{u.email}</td>
                        <td style={{ textAlign: 'right' }}>
                          {!esActual && (
                            <button
                              type="button"
                              className="btn sm ghost danger"
                              onClick={() => eliminar(u)}
                              title="Eliminar cuenta"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

