import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

const logoImg = '/logo.png';

const GoogleBtn = lazy(() => import('./GoogleBtn'));

export default function Login() {
  const { usuario, entrar } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cfg, setCfg] = useState<{ googleClientId: string | null }>({ googleClientId: null });

  useEffect(() => { api('/auth/config', { auth: false }).then(setCfg).catch(() => {}); }, []);
  if (usuario) return <Navigate to="/encuestas" replace />;

  const ok = (r: any) => { entrar(r); nav('/encuestas', { replace: true }); };
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      ok(await api('/auth/login', { method: 'POST', body: f, auth: false }));
    } catch (err: any) { setError(err.message); } finally { setCargando(false); }
  };
  const google = async (credential: string) => {
    setError('');
    try { ok(await api('/auth/google', { method: 'POST', body: { credential }, auth: false })); } catch (err: any) { setError(err.message); }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoImg} alt="Vilaseca - CaliTori" className="login-logo-img" />
        </div>
        <h1>Vilaseca - CaliTori</h1>
        <p className="login-sub">Calidad y Toma de Resultados e Indicadores</p>
        <p className="muted sm">Gestiona encuestas, captura opiniones y analiza indicadores de calidad en tiempo real.</p>

        <form onSubmit={enviar} className="form-col">
          <label className="campo"><span>Correo</span>
            <input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></label>
          <label className="campo"><span>Contraseña</span>
            <input className="input" type="password" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })}
              autoComplete="current-password" /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary lg" disabled={cargando}>{cargando ? 'Un momento…' : 'Ingresar'}</button>
        </form>

        {cfg.googleClientId && (
          <>
            <div className="sep"><span>o</span></div>
            <div className="google">
              <Suspense fallback={null}>
                <GoogleBtn clientId={cfg.googleClientId} onToken={google} onError={() => setError('No se pudo iniciar sesión con Google')} />
              </Suspense>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
