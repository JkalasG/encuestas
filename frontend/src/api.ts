const TOKEN = 'enc_token';
export const getToken = () => {
  try { return localStorage.getItem(TOKEN); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN); } catch { /* sin storage */ }
};

export class ApiError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

async function leerError(r: Response) {
  try {
    const j = await r.json();
    return Array.isArray(j.message) ? j.message.join(', ') : j.message || 'Error inesperado';
  } catch { return 'Error inesperado'; }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let r: Response;
  try {
    r = await fetch('/api' + path, { method: opts.method || 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, 'No hay conexión con el servidor');
  }
  if (!r.ok) {
    if (r.status === 401 && opts.auth !== false && t) { setToken(null); window.dispatchEvent(new Event('enc-logout')); }
    throw new ApiError(r.status, await leerError(r));
  }
  return r.json();
}

export async function descargarExcel(id: string, nombreBase: string) {
  const r = await fetch(`/api/encuestas/${id}/exportar`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!r.ok) throw new ApiError(r.status, await leerError(r));
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombreBase}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
