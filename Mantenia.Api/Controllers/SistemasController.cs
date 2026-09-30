using Mantenia.Api.DTOs.App;
using Mantenia.Api.Interfaces;
using Mantenia.Api.Services.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mantenia.Api.Controllers;

/// <summary>
/// Configuración general (solo rol Sistemas): tipos de organización con sus módulos y textos,
/// y catálogos globales. Cada operación devuelve la configuración actualizada.
/// </summary>
[ApiController]
[Authorize(Policy = Politicas.Sistemas)]
[Route("api/app/sistemas")]
[Produces("application/json")]
public sealed class SistemasController(ISistemasAppService sistemas) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<SistemasDto>> Get(CancellationToken ct)
        => Ok(await sistemas.GetAsync(ct));

    [HttpPost("tipos-organizacion")]
    public async Task<ActionResult<SistemasDto>> CrearTipo([FromBody] TipoOrganizacionGuardarDto dto, CancellationToken ct)
        => Ok(await sistemas.CrearTipoAsync(dto, ct));

    [HttpPut("tipos-organizacion/{id:int}")]
    public async Task<ActionResult<SistemasDto>> GuardarTipo(int id, [FromBody] TipoOrganizacionGuardarDto dto, CancellationToken ct)
        => Resultado(await sistemas.GuardarTipoAsync(id, dto, ct));

    /// <summary>Deja habilitados exactamente esos módulos para el tipo (al quitar uno se borran sus textos).</summary>
    [HttpPut("tipos-organizacion/{id:int}/modulos")]
    public async Task<ActionResult<SistemasDto>> GuardarModulos(int id, [FromBody] ModulosTipoDto dto, CancellationToken ct)
        => Resultado(await sistemas.GuardarModulosAsync(id, dto, ct));

    [HttpPost("tipos-organizacion/{id:int}/labels")]
    public async Task<ActionResult<SistemasDto>> CrearLabel(int id, [FromBody] LabelCrearDto dto, CancellationToken ct)
        => Resultado(await sistemas.CrearLabelAsync(id, dto, ct));

    [HttpPut("labels/{id:int}")]
    public async Task<ActionResult<SistemasDto>> GuardarLabel(int id, [FromBody] LabelGuardarDto dto, CancellationToken ct)
        => Resultado(await sistemas.GuardarLabelAsync(id, dto, ct));

    [HttpDelete("labels/{id:int}")]
    public async Task<ActionResult<SistemasDto>> EliminarLabel(int id, CancellationToken ct)
        => Resultado(await sistemas.EliminarLabelAsync(id, ct));

    [HttpPost("estados-orden")]
    public async Task<ActionResult<SistemasDto>> CrearEstadoOrden([FromBody] EstadoOrdenGuardarDto dto, CancellationToken ct)
        => Ok(await sistemas.CrearEstadoOrdenAsync(dto, ct));

    [HttpPut("estados-orden/{id:int}")]
    public async Task<ActionResult<SistemasDto>> GuardarEstadoOrden(int id, [FromBody] EstadoOrdenGuardarDto dto, CancellationToken ct)
        => Resultado(await sistemas.GuardarEstadoOrdenAsync(id, dto, ct));

    [HttpDelete("estados-orden/{id:int}")]
    public async Task<ActionResult<SistemasDto>> EliminarEstadoOrden(int id, CancellationToken ct)
        => Resultado(await sistemas.EliminarEstadoOrdenAsync(id, ct));

    [HttpPost("prioridades")]
    public async Task<ActionResult<SistemasDto>> CrearPrioridad([FromBody] DescripcionDto dto, CancellationToken ct)
        => Ok(await sistemas.CrearPrioridadAsync(dto, ct));

    [HttpPut("prioridades/{id:int}")]
    public async Task<ActionResult<SistemasDto>> RenombrarPrioridad(int id, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await sistemas.RenombrarPrioridadAsync(id, dto, ct));

    [HttpDelete("prioridades/{id:int}")]
    public async Task<ActionResult<SistemasDto>> EliminarPrioridad(int id, CancellationToken ct)
        => Resultado(await sistemas.EliminarPrioridadAsync(id, ct));

    /// <summary>Estados de activo sin categoría: los ven todas las organizaciones (ej. "Programado").</summary>
    [HttpPost("estados-activo")]
    public async Task<ActionResult<SistemasDto>> CrearEstadoGeneral([FromBody] DescripcionDto dto, CancellationToken ct)
        => Ok(await sistemas.CrearEstadoGeneralAsync(dto, ct));

    [HttpPut("estados-activo/{id:int}")]
    public async Task<ActionResult<SistemasDto>> RenombrarEstadoGeneral(int id, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await sistemas.RenombrarEstadoGeneralAsync(id, dto, ct));

    [HttpDelete("estados-activo/{id:int}")]
    public async Task<ActionResult<SistemasDto>> EliminarEstadoGeneral(int id, CancellationToken ct)
        => Resultado(await sistemas.EliminarEstadoGeneralAsync(id, ct));

    [HttpPost("roles")]
    public async Task<ActionResult<SistemasDto>> CrearRol([FromBody] DescripcionDto dto, CancellationToken ct)
        => Ok(await sistemas.CrearRolAsync(dto, ct));

    /// <summary>Renombra un rol (Sistemas y Administrador están protegidos).</summary>
    [HttpPut("roles/{id:int}")]
    public async Task<ActionResult<SistemasDto>> RenombrarRol(int id, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await sistemas.RenombrarRolAsync(id, dto, ct));

    /// <summary>Borra un rol sin usuarios (Sistemas y Administrador están protegidos).</summary>
    [HttpDelete("roles/{id:int}")]
    public async Task<ActionResult<SistemasDto>> EliminarRol(int id, CancellationToken ct)
        => Resultado(await sistemas.EliminarRolAsync(id, ct));

    /// <summary>Define exactamente qué acciones (permisos por módulo) tiene el rol.</summary>
    [HttpPut("roles/{id:int}/permisos")]
    public async Task<ActionResult<SistemasDto>> GuardarPermisosRol(int id, [FromBody] PermisosRolDto dto, CancellationToken ct)
        => Resultado(await sistemas.GuardarPermisosRolAsync(id, dto, ct));

    private ActionResult<SistemasDto> Resultado(SistemasDto? dto) => dto is null ? NotFound() : Ok(dto);
}
