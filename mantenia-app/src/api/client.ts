const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "mantenia.sesion";

interface Sesion {
  token: string;
  expiraUtc: string;
}

// ---------------------------------------------------------------- sesión

export function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw) as Sesion;
    if (new Date(sesion.expiraUtc).getTime() <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: Sesion | null) {
  try {
    if (sesion) localStorage.setItem(TOKEN_KEY, JSON.stringify(sesion));
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible (modo privado): la sesión dura lo que la pestaña */
  }
}

let alExpirar: (() => void) | null = null;

/** Lo registra AuthProvider para cerrar la sesión cuando la API responde 401. */
export function onSesionExpirada(handler: (() => void) | null) {
  alExpirar = handler;
}

// ---------------------------------------------------------------- errores

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errores: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

async function leerError(res: Response): Promise<ApiError> {
  let problema: ProblemDetails = {};
  try {
    problema = (await res.json()) as ProblemDetails;
  } catch {
    /* sin cuerpo JSON */
  }

  const errores = problema.errors ?? {};
  const primerError = Object.values(errores).flat()[0];
  const mensaje =
    primerError ??
    problema.detail ??
    problema.title ??
    (res.status === 404
      ? "No se encontró lo que buscabas."
      : res.status >= 500
        ? "La API tuvo un problema. Probá de nuevo en unos segundos."
        : `Error ${res.status}`);
  return new ApiError(res.status, mensaje, errores);
}

// ---------------------------------------------------------------- fetch

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const sesion = leerSesion();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (sesion) headers.Authorization = `Bearer ${sesion.token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(0, "No hay conexión con la API. Revisá que esté levantada y tu conexión a internet.");
  }

  if (res.status === 401 && sesion) {
    guardarSesion(null);
    alExpirar?.();
    throw new ApiError(401, "Tu sesión venció. Ingresá de nuevo.");
  }

  if (!res.ok) throw await leerError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
