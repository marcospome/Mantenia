using Mantenia.Api.DTOs.App;

namespace Mantenia.Api.Interfaces;

/// <summary>Datos del usuario logueado, leídos del JWT.</summary>
public interface ICurrentUser
{
    int IdUsuario { get; }
    int? IdOrganizacion { get; }
}

public interface IContextoAppService
{
    Task<ContextoDto?> GetContextoAsync(CancellationToken ct = default);
    Task<CatalogosDto> GetCatalogosAsync(CancellationToken ct = default);
}

public interface IActivosAppService
{
    Task<ActivosListadoDto> ListarAsync(string? buscar, string? filtro, CancellationToken ct = default);
    Task<ActivoFichaDto?> GetFichaAsync(int idActivo, CancellationToken ct = default);
    Task<CodigoEncontradoDto?> BuscarPorCodigoAsync(string codigo, CancellationToken ct = default);
    Task<ActivoEdicionDto?> GetEdicionAsync(int idActivo, CancellationToken ct = default);
    Task<ActivoEdicionDto> CrearAsync(ActivoGuardarDto dto, CancellationToken ct = default);
    Task<ActivoEdicionDto?> GuardarAsync(int idActivo, ActivoGuardarDto dto, CancellationToken ct = default);
    Task<bool> EliminarAsync(int idActivo, CancellationToken ct = default);
    Task<ClienteDto> CrearClienteAsync(ClienteCrearDto dto, CancellationToken ct = default);
}

public interface IOrdenesAppService
{
    Task<IReadOnlyList<OrdenResumenDto>> ListarAsync(string? estado, int? idActivo, CancellationToken ct = default);
    Task<OrdenDetalleDto?> GetDetalleAsync(int idOrden, CancellationToken ct = default);
    Task<OrdenDetalleDto?> CrearAsync(NuevaOrdenDto dto, CancellationToken ct = default);
    Task<OrdenDetalleDto?> CambiarEstadoAsync(int idOrden, CambioEstadoDto dto, CancellationToken ct = default);
    Task<OrdenDetalleDto?> AgregarRepuestoAsync(int idOrden, RepuestoInputDto dto, CancellationToken ct = default);
    Task<OrdenDetalleDto?> GuardarRepuestoAsync(int idDetalle, RepuestoInputDto dto, CancellationToken ct = default);
    Task<OrdenDetalleDto?> EliminarRepuestoAsync(int idDetalle, CancellationToken ct = default);
}

public interface IDashboardAppService
{
    Task<DashboardDto> GetAsync(CancellationToken ct = default);
    Task<ReporteDto> GetReporteAsync(int meses, CancellationToken ct = default);
}

public interface IAjustesAppService
{
    Task<AjustesOrganizacionDto> GetAsync(CancellationToken ct = default);
    Task<AjustesOrganizacionDto> CrearCategoriaAsync(DescripcionDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> RenombrarCategoriaAsync(int id, DescripcionDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> EliminarCategoriaAsync(int id, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> CrearEstadoAsync(int idCategoria, DescripcionDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> RenombrarEstadoAsync(int id, DescripcionDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> EliminarEstadoAsync(int id, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> CrearTipoTrabajoAsync(int idCategoria, TipoTrabajoGuardarDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> GuardarTipoTrabajoAsync(int id, TipoTrabajoGuardarDto dto, CancellationToken ct = default);
    Task<AjustesOrganizacionDto?> EliminarTipoTrabajoAsync(int id, CancellationToken ct = default);
}

public interface ISistemasAppService
{
    Task<SistemasDto> GetAsync(CancellationToken ct = default);
    Task<SistemasDto> CrearTipoAsync(TipoOrganizacionGuardarDto dto, CancellationToken ct = default);
    Task<SistemasDto?> GuardarTipoAsync(int id, TipoOrganizacionGuardarDto dto, CancellationToken ct = default);
    Task<SistemasDto?> GuardarModulosAsync(int idTipo, ModulosTipoDto dto, CancellationToken ct = default);
    Task<SistemasDto?> CrearLabelAsync(int idTipo, LabelCrearDto dto, CancellationToken ct = default);
    Task<SistemasDto?> GuardarLabelAsync(int id, LabelGuardarDto dto, CancellationToken ct = default);
    Task<SistemasDto?> EliminarLabelAsync(int id, CancellationToken ct = default);
    Task<SistemasDto> CrearEstadoOrdenAsync(EstadoOrdenGuardarDto dto, CancellationToken ct = default);
    Task<SistemasDto?> GuardarEstadoOrdenAsync(int id, EstadoOrdenGuardarDto dto, CancellationToken ct = default);
    Task<SistemasDto?> EliminarEstadoOrdenAsync(int id, CancellationToken ct = default);
    Task<SistemasDto> CrearPrioridadAsync(DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> RenombrarPrioridadAsync(int id, DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> EliminarPrioridadAsync(int id, CancellationToken ct = default);
    Task<SistemasDto> CrearEstadoGeneralAsync(DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> RenombrarEstadoGeneralAsync(int id, DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> EliminarEstadoGeneralAsync(int id, CancellationToken ct = default);
    Task<SistemasDto> CrearRolAsync(DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> RenombrarRolAsync(int id, DescripcionDto dto, CancellationToken ct = default);
    Task<SistemasDto?> EliminarRolAsync(int id, CancellationToken ct = default);
    Task<SistemasDto?> GuardarPermisosRolAsync(int idRol, PermisosRolDto dto, CancellationToken ct = default);
}
