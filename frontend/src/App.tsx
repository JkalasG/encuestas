import { lazy, Suspense } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { BarChart3, ClipboardList, LogOut, Users } from 'lucide-react';
import { AuthProvider, useAuth } from './auth';

const logoImg = '/logo.png';

// Cada pantalla es su propio paquete: la encuesta publica no descarga graficos ni login.
const Publica = lazy(() => import('./pages/Publica'));
const Login = lazy(() => import('./pages/Login'));
const Encuestas = lazy(() => import('./pages/Encuestas'));
const Editor = lazy(() => import('./pages/Editor'));
const Respuestas = lazy(() => import('./pages/Respuestas'));
const DetalleRespuestas = lazy(() => import('./pages/DetalleRespuestas'));
const Usuarios = lazy(() => import('./pages/Usuarios'));

function Cargando() {
  return <div className="center-screen"><div className="spinner" /></div>;
}

function Panel() {
  const { usuario, cargando, salir } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <span className="logo" title="Calidad y Toma de Resultados e Indicadores">
            <img src={logoImg} alt="Vilaseca" className="logo-img" />
            <span className="logo-txt">CaliTori</span>
          </span>
          <nav>
            <NavLink to="/encuestas"><ClipboardList size={17} /> Encuestas</NavLink>
            <NavLink to="/respuestas"><BarChart3 size={17} /> Respuestas</NavLink>
            <NavLink to="/usuarios"><Users size={17} /> Usuarios</NavLink>
          </nav>
          <span className="spacer" />
          <span className="user">{usuario.nombre}</span>
          <button className="btn ghost sm" onClick={salir}><LogOut size={16} /> Salir</button>
        </div>
      </header>
      <main className="container">
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/s/:slug" element={<Publica />} />
        <Route
          path="/login"
          element={<AuthProvider><Login /></AuthProvider>}
        />
        <Route element={<AuthProvider><Panel /></AuthProvider>}>
          <Route path="/encuestas" element={<Encuestas />} />
          <Route path="/encuestas/nueva" element={<Editor />} />
          <Route path="/encuestas/:id" element={<Editor />} />
          <Route path="/respuestas" element={<Respuestas />} />
          <Route path="/respuestas/:id" element={<DetalleRespuestas />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
        <Route path="*" element={<Navigate to="/encuestas" replace />} />
      </Routes>
    </Suspense>
  );
}
