using System.ComponentModel.DataAnnotations;

namespace Mantenia.Api.DTOs.App;

// ---------------------------------------------------------------- Ajustes de la organización (Administrador)

/// <summary>Elemento editable de un catálogo. Usos = registros que lo referencian (si es > 0 no se puede borrar).</summary>
public sealed record ItemAjusteDto(int Id, string Descripcion, int Usos);

public sealed record TipoTrabajoAjusteDto(int Id, string Descripcion, int Usos, IReadOnlyList<int> IdsEstadoOrden);

public sealed record CategoriaAjusteDto(
    int Id,
    string Descripcion,
    int Activos,
    IReadOnlyList<ItemAjusteDto> Estados,
    IReadOnlyList<TipoTrabajoAjusteDto> TiposTrabajo);

/// <summary>Lo que la organización puede configurar, más lo general (solo lectura) como referencia.</summary>
public sealed record AjustesOrganizacionDto(
    string? Organizacion,
    IReadOnlyList<CategoriaAjusteDto> Categorias,
    IReadOnlyList<ItemDto> EstadosActivoGenerales,
    IReadOnlyList<ItemDto> EstadosOrden);

public sealed record DescripcionDto([Required, StringLength(100, MinimumLength = 1)] string Descripcion);

public sealed record TipoTrabajoGuardarDto(
    [Required, StringLength(100, MinimumLength = 1)] string Descripcion,
    IReadOnlyList<int>? IdsEstadoOrden);

// ---------------------------------------------------------------- Sistemas (general por tipo de organización y global)

public sealed record ModuloTipoDto(int IdTipoOrganizacionModulo, int IdModulo);

public sealed record LabelDto(int Id, int IdModulo, string Clave, string Valor);

public sealed record TipoOrganizacionSistemasDto(
    int Id,
    string Descripcion,
    bool Activo,
    int Organizaciones,
    IReadOnlyList<ModuloTipoDto> Modulos,
    IReadOnlyList<LabelDto> Labels);

public sealed record EstadoOrdenSistemasDto(int Id, string Descripcion, bool EsFinal, int Usos);

/// <summary>
/// Rol con sus permisos. Protegido = Sistemas o Administrador: la API depende de su nombre, así que no se renombran ni borran.
/// TodosLosPermisos = Sistemas, que tiene todo sin necesidad de asignarlo.
/// </summary>
public sealed record RolSistemasDto(int Id, string Descripcion, int Usuarios, bool Protegido, bool TodosLosPermisos, IReadOnlyList<int> IdsAccion);

public sealed record AccionSistemasDto(int Id, int? IdModulo, string Descripcion, string? Clave);

public sealed record SistemasDto(
    IReadOnlyList<TipoOrganizacionSistemasDto> TiposOrganizacion,
    IReadOnlyList<ItemDto> Modulos,
    IReadOnlyList<EstadoOrdenSistemasDto> EstadosOrden,
    IReadOnlyList<ItemAjusteDto> Prioridades,
    IReadOnlyList<ItemAjusteDto> EstadosActivoGenerales,
    IReadOnlyList<RolSistemasDto> Roles,
    IReadOnlyList<AccionSistemasDto> Acciones);

public sealed record PermisosRolDto([Required] IReadOnlyList<int> IdsAccion);

public sealed record TipoOrganizacionGuardarDto([Required, StringLength(100, MinimumLength = 1)] string Descripcion, bool Activo = true);

public sealed record ModulosTipoDto([Required] IReadOnlyList<int> IdsModulo);

public sealed record LabelCrearDto(
    [Required] int IdModulo,
    [Required, StringLength(100, MinimumLength = 1)] string Clave,
    [Required, StringLength(255)] string Valor);

public sealed record LabelGuardarDto(
    [Required, StringLength(100, MinimumLength = 1)] string Clave,
    [Required, StringLength(255)] string Valor);

public sealed record EstadoOrdenGuardarDto([Required, StringLength(100, MinimumLength = 1)] string Descripcion, bool EsFinal);
