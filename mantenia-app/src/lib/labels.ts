import type { Perfil } from "../api/types";

/**
 * Textos de la app según el perfil de la organización.
 * Cualquier clave se puede sobrescribir desde la base, en LabelTipoOrganizacionModulo (Clave → Valor).
 */
const base = {
  appSubtitulo: "Mantenimiento predictivo para tu planta",
  activo: "Activo",
  activos: "Activos",
  ordenes: "Órdenes",
  orden: "Orden de trabajo",
  identificador: "ID",
  identificadorAyuda: "Código del equipo (es el que lleva el QR)",
  buscarActivos: "Buscar por nombre o ID",
  filtroRiesgo: "En riesgo",
  filtroDetenidos: "Detenidos",
  badgeRiesgo: "En riesgo",
  badgeRevisar: "Revisar",
  badgeDetenido: "Detenido",
  badgeOk: "OK",
  resumen: "Resumen",
  listaInicio: "Próximas revisiones",
  escanearTitulo: "Escanear activo",
  escanearApunta: "Apuntá al código QR",
  escanearAyuda: "Lo encontrás en la etiqueta del equipo",
  escanearManual: "Ingresar código manual",
  accionNuevaOrden: "Reportar falla",
  tipoTrabajo: "Tipo de problema",
  descripcion: "Descripción",
  descripcionPlaceholder: "¿Qué está pasando? Ej.: ruido metálico al arrancar, se detiene a los 5 min.",
  enviarOrden: "Enviar reporte",
  historial: "Historial",
  reporteSerie: "Horas de downtime",
  reporteCosto: "Costo reparaciones",
  reporteSegundo: "OT cerradas",
  reporteLista: "Activos críticos",
} as const;

export type LabelKey = keyof typeof base;

const taller: Partial<Record<LabelKey, string>> = {
  appSubtitulo: "Mantenimiento predictivo para tu taller",
  activo: "Vehículo",
  activos: "Vehículos",
  ordenes: "Trabajos",
  identificador: "Patente",
  identificadorAyuda: "Patente del vehículo (se usa también para el QR)",
  buscarActivos: "Buscar patente o cliente",
  filtroRiesgo: "Vencidos",
  filtroDetenidos: "En taller",
  badgeRiesgo: "Vencido",
  badgeRevisar: "Avisar",
  badgeDetenido: "En taller",
  badgeOk: "Al día",
  resumen: "Hoy en el taller",
  listaInicio: "Trabajos en curso",
  escanearTitulo: "Escanear vehículo",
  escanearApunta: "Apuntá al QR del vehículo",
  escanearAyuda: "Sticker del parabrisas o llavero del taller",
  escanearManual: "Buscar por patente",
  accionNuevaOrden: "Nueva orden de trabajo",
  tipoTrabajo: "Tipo de trabajo",
  descripcion: "Diagnóstico",
  descripcionPlaceholder: "Ej.: ruido en distribución en frío. Cambiar correa, tensor y bomba de agua.",
  enviarOrden: "Crear orden",
  historial: "Historial de trabajos",
  reporteSerie: "Trabajos realizados",
  reporteCosto: "Facturado",
  reporteSegundo: "Clientes que volvieron",
  reporteLista: "Clientes para contactar",
};

export function crearTraductor(perfil: Perfil, desdeServidor: Record<string, string> = {}) {
  const textos: Record<string, string> = { ...base, ...(perfil === "taller" ? taller : {}), ...desdeServidor };
  return (clave: LabelKey) => textos[clave] ?? base[clave];
}

export type Traductor = ReturnType<typeof crearTraductor>;
