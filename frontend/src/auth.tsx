import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getToken, setToken } from './api';

interface Usuario { id: string; nombre: string; email?: string }
interface Ctx {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (r: { token: string; usuario: Usuario }) => void;
  salir: () => void;
}
const AuthCtx = createContext<Ctx>(null as any);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api<Usuario>('/auth/yo').then(setUsuario).catch(() => setToken(null)).finally(() => setCargando(false));
  }, []);

  const salir = useCallback(() => { setToken(null); setUsuario(null); }, []);
  useEffect(() => {
    window.addEventListener('enc-logout', salir);
    return () => window.removeEventListener('enc-logout', salir);
  }, [salir]);

  const entrar = useCallback((r: { token: string; usuario: Usuario }) => { setToken(r.token); setUsuario(r.usuario); }, []);
  const value = useMemo(() => ({ usuario, cargando, entrar, salir }), [usuario, cargando, entrar, salir]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
