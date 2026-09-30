using System.ComponentModel.DataAnnotations;

namespace Mantenia.Api.DTOs.App;

// ---------------------------------------------------------------- Contexto

/// <summary>Quién está logueado y cómo debe verse la app (perfil planta o taller).</summary>
public sealed record ContextoDto(
    UsuarioDto Usuario,
    string? Rol,
    int? IdOrganizacion,
    string? Organizacion,
    string? Logo,
    string? TipoOrganizacion,
    string Perfil,
    string? Plan,
    IReadOnlyDictionary<string, string> Labels,
    bool PuedeAjustes,
    bool EsSistemas,
    IReadOnlyList<string> Permisos);

public sealed record ItemDto(int Id, string Descripcion, int? IdPadre = null, string? Extra = null);

public sealed record CatalogosDto(
    IReadOnlyList<ItemDto> Categorias,
    IReadOnlyList<ItemDto> EstadosActivo,
    IReadOnlyList<ItemDto> Clientes,
    IReadOnlyList<ItemDto> Ubicaciones,
    IReadOnlyList<ItemDto> TiposTrabajo,
    IReadOnlyList<ItemDto> Prioridades,
    IReadOnlyList<ItemDto> EstadosOrden);

// ---------------------------------------------------------------- Activos

/// <summary>Indicadores calculados a partir del historial de órdenes del activo.</summary>
public sealed record SaludDto(
    double? MtbfDias,
    int? DiasProximaFalla,
    DateTime? FechaProximaFalla,
    int Probabilidad,
    string Nivel,
    bool Detenido,
    int CantidadOrdenes,
    int Fallas,
    int? KmActual,
    int? KmProximoService,
    int? KmExcedido,
    string? Sugerencia);

public sealed record ActivoResumenDto(
    int IdActivo,
    string? Nombre,
    string? Identificador,
    string? Marca,
    string? Modelo,
    int? IdCategoriaActivo,
    string? Categoria,
    int? IdCliente,
    string? Ubicacion,
    string? Cliente,
    string? TelefonoCliente,
    string? Estado,
    SaludDto Salud);

public sealed record ActivosListadoDto(
    IReadOnlyList<ActivoResumenDto> Items,
    int Total,
    int EnRiesgo,
    int Revisar,
    int Detenidos);

public sealed record ActivoFichaDto(ActivoResumenDto Activo, IReadOnlyList<OrdenResumenDto> Historial);

public sealed record CodigoEncontradoDto(int IdActivo, string? Nombre);

/// <summary>Campos editables del activo (formulario de alta/edición).</summary>
public sealed record ActivoEdicionDto(
    int IdActivo,
    int? IdCategoriaActivo,
    int? IdCliente,
    int? IdUbicacion,
    int? IdEstadoActivo,
    string? Identificador,
    string? Nombre,
    string? Marca,
    string? Modelo);

public sealed class ActivoGuardarDto
{
    public int? IdCategoriaActivo { get; set; }
    public int? IdCliente { get; set; }
    public int? IdUbicacion { get; set; }
    public int? IdEstadoActivo { get; set; }

    [StringLength(100)]
    public string? Identificador { get; set; }

    [Required]
    [StringLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Marca { get; set; }

    [StringLength(100)]
    public string? Modelo { get; set; }
}

// ---------------------------------------------------------------- Clientes

public sealed record ClienteDto(int IdCliente, string? Nombre, string? Apellido, string? Telefono, string? Email);

/// <summary>Alta rápida de cliente desde el formulario del activo. Queda en la organización del usuario.</summary>
public sealed class ClienteCrearDto
{
    [Required]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Apellido { get; set; }

    [StringLength(50)]
    public string? Telefono { get; set; }

    [StringLength(150)]
    [EmailAddress]
    public string? Email { get; set; }
}

// ---------------------------------------------------------------- Órdenes

public sealed record OrdenResumenDto(
    int IdOrdenTrabajo,
    int? IdActivo,
    string Activo,
    string? Identificador,
    string? Cliente,
    string? TipoTrabajo,
    bool EsFalla,
    int? IdEstadoOrden,
    string? Estado,
    bool Abierta,
    string? Prioridad,
    DateTime? FechaCreacion,
    DateTime? FechaProgramada,
    DateTime? FechaInicio,
    DateTime? FechaCierre,
    string? Descripcion,
    int? Kilometraje,
    string? Usuario);

public sealed record RepuestoDto(int IdOrdenTrabajoDetalle, string? Repuesto, int? Cantidad, decimal? Costo);

public sealed record OrdenDetalleDto(
    OrdenResumenDto Orden,
    string? Diagnostico,
    decimal? Importe,
    decimal CostoRepuestos,
    IReadOnlyList<RepuestoDto> Repuestos,
    IReadOnlyList<ItemDto> EstadosDisponibles);

public sealed class RepuestoInputDto
{
    [Required]
    [StringLength(150)]
    public string Repuesto { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Cantidad { get; set; } = 1;

    [Range(0, double.MaxValue)]
    public decimal? Costo { get; set; }
}

public sealed class NuevaOrdenDto
{
    [Required]
    public int? IdActivo { get; set; }

    public int? IdTipoTrabajo { get; set; }
    public int? IdPrioridad { get; set; }

    [StringLength(4000)]
    public string? Descripcion { get; set; }

    [StringLength(4000)]
    public string? Diagnostico { get; set; }

    [Range(0, 9_999_999)]
    public int? Kilometraje { get; set; }

    public DateTime? FechaProgramada { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Importe { get; set; }

    public List<RepuestoInputDto> Repuestos { get; set; } = [];
}

public sealed class CambioEstadoDto
{
    [Required]
    public int? IdEstadoOrden { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Importe { get; set; }

    [StringLength(4000)]
    public string? Diagnostico { get; set; }
}

// ---------------------------------------------------------------- Dashboard

public sealed record ResumenDto(
    int TotalActivos,
    int OrdenesAbiertas,
    double Disponibilidad,
    int EnTaller,
    int TurnosHoy,
    int ServicesVencidos);

public sealed record AlertaDto(
    int IdActivo,
    string Nombre,
    string? Identificador,
    string Mensaje,
    int Probabilidad,
    string? Cliente,
    string? TelefonoCliente);

public sealed record DashboardDto(
    ResumenDto Resumen,
    AlertaDto? Alerta,
    IReadOnlyList<OrdenResumenDto> Proximas,
    IReadOnlyList<OrdenResumenDto> EnCurso);

// ---------------------------------------------------------------- Reportes

public sealed record PuntoMensualDto(string Mes, string Etiqueta, double HorasDetenido, int OrdenesCerradas, decimal Costo);

public sealed record ActivoCriticoDto(int IdActivo, string Nombre, int Fallas, double HorasDetenido, string Accion);

public sealed record ContactoDto(int IdActivo, string Activo, string? Cliente, string? Telefono, string Motivo);

public sealed record ReporteDto(
    int Meses,
    IReadOnlyList<PuntoMensualDto> Serie,
    double HorasDetenidoUltimoMes,
    double? VariacionHoras,
    int OrdenesUltimoMes,
    double? VariacionOrdenes,
    decimal CostoTotal,
    int OrdenesCerradas,
    double? PorcentajeClientesRecurrentes,
    IReadOnlyList<ActivoCriticoDto> Criticos,
    IReadOnlyList<ContactoDto> Contactar);
