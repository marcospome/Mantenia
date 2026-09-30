import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  ActivoCrud,
  ActivoFicha,
  ActivoInput,
  ActivosListado,
  AjustesOrganizacion,
  Catalogos,
  ClienteCrud,
  ClienteInput,
  Contexto,
  Dashboard,
  LoginResponse,
  NuevaOrden,
  OrdenDetalle,
  OrdenResumen,
  Reporte,
  Sistemas,
} from "./types";

// ---------------------------------------------------------------- auth

export const login = (email: string, clave: string) =>
  api<LoginResponse>("/api/auth/login", { method: "POST", body: { email, clave } });

export const cambiarClave = (claveActual: string, nuevaClave: string) =>
  api<void>("/api/auth/cambiar-clave", { method: "POST", body: { claveActual, nuevaClave } });

export const buscarPorCodigo = (codigo: string) =>
  api<{ idActivo: number; nombre: string | null }>(`/api/app/activos/codigo/${encodeURIComponent(codigo.trim())}`);

// ---------------------------------------------------------------- consultas

export const claves = {
  contexto: ["contexto"] as const,
  catalogos: ["catalogos"] as const,
  dashboard: ["dashboard"] as const,
  activos: (buscar: string, filtro: string) => ["activos", buscar, filtro] as const,
  ficha: (id: number) => ["activo", id] as const,
  activoCrud: (id: number) => ["activo-crud", id] as const,
  ordenes: (estado: string, idActivo?: number) => ["ordenes", estado, idActivo ?? null] as const,
  orden: (id: number) => ["orden", id] as const,
  reporte: (meses: number) => ["reporte", meses] as const,
};

export function useContexto(habilitado: boolean) {
  return useQuery({
    queryKey: claves.contexto,
    queryFn: ({ signal }) => api<Contexto>("/api/app/contexto", { signal }),
    enabled: habilitado,
    staleTime: 10 * 60_000,
  });
}

export function useCatalogos() {
  return useQuery({
    queryKey: claves.catalogos,
    queryFn: ({ signal }) => api<Catalogos>("/api/app/catalogos", { signal }),
    staleTime: 5 * 60_000,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: claves.dashboard,
    queryFn: ({ signal }) => api<Dashboard>("/api/app/dashboard", { signal }),
  });
}

export function useActivos(buscar: string, filtro: string) {
  return useQuery({
    queryKey: claves.activos(buscar, filtro),
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams();
      if (buscar) qs.set("buscar", buscar);
      if (filtro !== "todos") qs.set("filtro", filtro);
      return api<ActivosListado>(`/api/app/activos?${qs}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useFicha(id: number) {
  return useQuery({
    queryKey: claves.ficha(id),
    queryFn: ({ signal }) => api<ActivoFicha>(`/api/app/activos/${id}`, { signal }),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useActivoCrud(id: number | null) {
  return useQuery({
    queryKey: claves.activoCrud(id ?? 0),
    queryFn: ({ signal }) => api<ActivoCrud>(`/api/app/activos/${id}/edicion`, { signal }),
    enabled: id !== null && id > 0,
  });
}

export function useOrdenes(estado: string, idActivo?: number) {
  return useQuery({
    queryKey: claves.ordenes(estado, idActivo),
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams({ estado });
      if (idActivo) qs.set("idActivo", String(idActivo));
      return api<OrdenResumen[]>(`/api/app/ordenes?${qs}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useOrden(id: number) {
  return useQuery({
    queryKey: claves.orden(id),
    queryFn: ({ signal }) => api<OrdenDetalle>(`/api/app/ordenes/${id}`, { signal }),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useReporte(meses: number) {
  return useQuery({
    queryKey: claves.reporte(meses),
    queryFn: ({ signal }) => api<Reporte>(`/api/app/reportes?meses=${meses}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

// ---------------------------------------------------------------- mutaciones

/** Después de cualquier cambio, los indicadores (dashboard, salud, reportes) se recalculan. */
function useInvalidarTodo() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      ["dashboard", "activos", "activo", "activo-crud", "ordenes", "orden", "reporte", "catalogos"].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
}

export function useCrearOrden() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (dto: NuevaOrden) => api<OrdenDetalle>("/api/app/ordenes", { method: "POST", body: dto }),
    onSuccess: invalidar,
  });
}

export function useCambiarEstado(idOrden: number) {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (dto: { idEstadoOrden: number; importe?: number | null; diagnostico?: string | null }) =>
      api<OrdenDetalle>(`/api/app/ordenes/${idOrden}/estado`, { method: "PUT", body: dto }),
    onSuccess: invalidar,
  });
}

export interface RepuestoInput {
  repuesto: string;
  cantidad: number;
  costo: number | null;
}

/** Alta, edición y baja de repuestos de una orden ya creada. */
export function useRepuestos(idOrden: number) {
  const qc = useQueryClient();
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (op: { accion: "agregar"; dto: RepuestoInput } | { accion: "guardar"; id: number; dto: RepuestoInput } | { accion: "borrar"; id: number }) =>
      op.accion === "agregar"
        ? api<OrdenDetalle>(`/api/app/ordenes/${idOrden}/repuestos`, { method: "POST", body: op.dto })
        : op.accion === "guardar"
          ? api<OrdenDetalle>(`/api/app/ordenes/repuestos/${op.id}`, { method: "PUT", body: op.dto })
          : api<OrdenDetalle>(`/api/app/ordenes/repuestos/${op.id}`, { method: "DELETE" }),
    onSuccess: (orden) => {
      qc.setQueryData(claves.orden(idOrden), orden);
      void invalidar();
    },
  });
}

export function useGuardarActivo(id: number | null) {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (dto: ActivoInput) =>
      id
        ? api<ActivoCrud>(`/api/app/activos/${id}`, { method: "PUT", body: dto })
        : api<ActivoCrud>("/api/app/activos", { method: "POST", body: dto }),
    onSuccess: invalidar,
  });
}

export function useEliminarActivo() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/app/activos/${id}`, { method: "DELETE" }),
    onSuccess: invalidar,
  });
}

// ---------------------------------------------------------------- ajustes y sistemas

export interface Operacion {
  metodo: "POST" | "PUT" | "DELETE";
  /** Ruta relativa a /api/app/ajustes o /api/app/sistemas, ej. "/categorias/3" */
  ruta: string;
  body?: unknown;
}

export function useAjustes() {
  return useQuery({
    queryKey: ["ajustes"],
    queryFn: ({ signal }) => api<AjustesOrganizacion>("/api/app/ajustes", { signal }),
  });
}

export function useSistemas() {
  return useQuery({
    queryKey: ["sistemas"],
    queryFn: ({ signal }) => api<Sistemas>("/api/app/sistemas", { signal }),
  });
}

/** Cada operación devuelve la configuración completa: se guarda directo en caché y se refrescan los catálogos. */
function useOperacionConfig<T>(base: "ajustes" | "sistemas") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (op: Operacion) => api<T>(`/api/app/${base}${op.ruta}`, { method: op.metodo, body: op.body }),
    onSuccess: (datos) => {
      qc.setQueryData([base], datos);
      for (const k of ["catalogos", "contexto", base === "ajustes" ? "sistemas" : "ajustes"]) {
        void qc.invalidateQueries({ queryKey: [k] });
      }
    },
  });
}

export const useOperacionAjustes = () => useOperacionConfig<AjustesOrganizacion>("ajustes");
export const useOperacionSistemas = () => useOperacionConfig<Sistemas>("sistemas");

export function useCrearCliente() {
  const invalidar = useInvalidarTodo();
  return useMutation({
    mutationFn: (dto: ClienteInput) => api<ClienteCrud>("/api/app/clientes", { method: "POST", body: dto }),
    onSuccess: invalidar,
  });
}
