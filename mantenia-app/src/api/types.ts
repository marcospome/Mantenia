// Tipos que devuelve la API (.NET serializa en camelCase)

export type Perfil = "planta" | "taller";
export type Nivel = "ok" | "revisar" | "riesgo";

export interface Usuario {
  idUsuario: number;
  idOrganizacion: number | null;
  idRol: number | null;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean | null;
}

export interface LoginResponse {
  token: string;
  expiraUtc: string;
}

export interface Contexto {
  usuario: Usuario;
  rol: string | null;
  idOrganizacion: number | null;
  organizacion: string | null;
  logo: string | null;
  tipoOrganizacion: string | null;
  perfil: Perfil;
  plan: string | null;
  labels: Record<string, string>;
  /** Administrador o Sistemas: puede editar los catálogos de su organización */
  puedeAjustes: boolean;
  /** Rol Sistemas: configura lo general por tipo de organización */
  esSistemas: boolean;
  /** Claves de las acciones permitidas para el rol (ej. "ordenes.crear") */
  permisos: string[];
}

/** Claves de la tabla Accion que la app y la API aplican. */
export type Permiso = "escanear.qr" | "ordenes.crear" | "ordenes.gestionar" | "activos.gestionar" | "reportes.exportar";

export interface Item {
  id: number;
  descripcion: string;
  idPadre: number | null;
  extra: string | null;
}

export interface Catalogos {
  categorias: Item[];
  estadosActivo: Item[];
  clientes: Item[];
  ubicaciones: Item[];
  tiposTrabajo: Item[];
  prioridades: Item[];
  estadosOrden: Item[];
}

export interface Salud {
  mtbfDias: number | null;
  diasProximaFalla: number | null;
  fechaProximaFalla: string | null;
  probabilidad: number;
  nivel: Nivel;
  detenido: boolean;
  cantidadOrdenes: number;
  fallas: number;
  kmActual: number | null;
  kmProximoService: number | null;
  kmExcedido: number | null;
  sugerencia: string | null;
}

export interface ActivoResumen {
  idActivo: number;
  nombre: string | null;
  identificador: string | null;
  marca: string | null;
  modelo: string | null;
  idCategoriaActivo: number | null;
  categoria: string | null;
  idCliente: number | null;
  ubicacion: string | null;
  cliente: string | null;
  telefonoCliente: string | null;
  estado: string | null;
  salud: Salud;
}

export interface ActivosListado {
  items: ActivoResumen[];
  total: number;
  enRiesgo: number;
  revisar: number;
  detenidos: number;
}

export interface OrdenResumen {
  idOrdenTrabajo: number;
  idActivo: number | null;
  activo: string;
  identificador: string | null;
  cliente: string | null;
  tipoTrabajo: string | null;
  esFalla: boolean;
  idEstadoOrden: number | null;
  estado: string | null;
  abierta: boolean;
  prioridad: string | null;
  fechaCreacion: string | null;
  fechaProgramada: string | null;
  fechaInicio: string | null;
  fechaCierre: string | null;
  descripcion: string | null;
  kilometraje: number | null;
  usuario: string | null;
}

export interface ActivoFicha {
  activo: ActivoResumen;
  historial: OrdenResumen[];
}

export interface Repuesto {
  idOrdenTrabajoDetalle: number;
  repuesto: string | null;
  cantidad: number | null;
  costo: number | null;
}

export interface OrdenDetalle {
  orden: OrdenResumen;
  diagnostico: string | null;
  importe: number | null;
  costoRepuestos: number;
  repuestos: Repuesto[];
  estadosDisponibles: Item[];
}

export interface NuevaOrden {
  idActivo: number;
  idTipoTrabajo?: number | null;
  idPrioridad?: number | null;
  descripcion?: string | null;
  diagnostico?: string | null;
  kilometraje?: number | null;
  fechaProgramada?: string | null;
  importe?: number | null;
  repuestos: { repuesto: string; cantidad: number; costo?: number | null }[];
}

export interface Dashboard {
  resumen: {
    totalActivos: number;
    ordenesAbiertas: number;
    disponibilidad: number;
    enTaller: number;
    turnosHoy: number;
    servicesVencidos: number;
  };
  alerta: {
    idActivo: number;
    nombre: string;
    identificador: string | null;
    mensaje: string;
    probabilidad: number;
    cliente: string | null;
    telefonoCliente: string | null;
  } | null;
  proximas: OrdenResumen[];
  enCurso: OrdenResumen[];
}

export interface Reporte {
  meses: number;
  serie: { mes: string; etiqueta: string; horasDetenido: number; ordenesCerradas: number; costo: number }[];
  horasDetenidoUltimoMes: number;
  variacionHoras: number | null;
  ordenesUltimoMes: number;
  variacionOrdenes: number | null;
  costoTotal: number;
  ordenesCerradas: number;
  porcentajeClientesRecurrentes: number | null;
  criticos: { idActivo: number; nombre: string; fallas: number; horasDetenido: number; accion: string }[];
  contactar: { idActivo: number; activo: string; cliente: string | null; telefono: string | null; motivo: string }[];
}

/** Tabla Activo tal como la maneja el CRUD /api/activos */
export interface ActivoCrud {
  idActivo: number;
  idCategoriaActivo: number | null;
  idCliente: number | null;
  idUbicacion: number | null;
  idEstadoActivo: number | null;
  identificador: string | null;
  nombre: string | null;
  marca: string | null;
  modelo: string | null;
}

export type ActivoInput = Omit<ActivoCrud, "idActivo">;

/** El cliente queda en la organización del usuario logueado. */
export interface ClienteInput {
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
}

export interface ClienteCrud extends ClienteInput {
  idCliente: number;
}

// ---------------------------------------------------------------- Ajustes (organización) y Sistemas (general)

/** Usos = registros que lo referencian; si es mayor a 0 no se puede borrar. */
export interface ItemAjuste {
  id: number;
  descripcion: string;
  usos: number;
}

export interface TipoTrabajoAjuste extends ItemAjuste {
  idsEstadoOrden: number[];
}

export interface CategoriaAjuste {
  id: number;
  descripcion: string;
  activos: number;
  estados: ItemAjuste[];
  tiposTrabajo: TipoTrabajoAjuste[];
}

export interface AjustesOrganizacion {
  organizacion: string | null;
  categorias: CategoriaAjuste[];
  estadosActivoGenerales: Item[];
  estadosOrden: Item[];
}

export interface LabelTipo {
  id: number;
  idModulo: number;
  clave: string;
  valor: string;
}

export interface TipoOrganizacionSistemas {
  id: number;
  descripcion: string;
  activo: boolean;
  organizaciones: number;
  modulos: { idTipoOrganizacionModulo: number; idModulo: number }[];
  labels: LabelTipo[];
}

export interface EstadoOrdenSistemas extends ItemAjuste {
  esFinal: boolean;
}

export interface RolSistemas {
  id: number;
  descripcion: string;
  usuarios: number;
  /** Sistemas y Administrador: no se renombran ni borran */
  protegido: boolean;
  /** Sistemas: tiene todo sin asignar */
  todosLosPermisos: boolean;
  idsAccion: number[];
}

export interface AccionSistemas {
  id: number;
  idModulo: number | null;
  descripcion: string;
  clave: string | null;
}

export interface Sistemas {
  tiposOrganizacion: TipoOrganizacionSistemas[];
  modulos: Item[];
  estadosOrden: EstadoOrdenSistemas[];
  prioridades: ItemAjuste[];
  estadosActivoGenerales: ItemAjuste[];
  roles: RolSistemas[];
  acciones: AccionSistemas[];
}
