using Mantenia.Api.DTOs.App;
using Mantenia.Api.Interfaces;
using Mantenia.Api.Services.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mantenia.Api.Controllers;

/// <summary>
/// Catálogos propios de la organización del usuario (Administrador o Sistemas):
/// categorías de activo, sus estados y sus tipos de trabajo. Cada operación devuelve los ajustes actualizados.
/// </summary>
[ApiController]
[Authorize(Policy = Politicas.AjustesOrganizacion)]
[Route("api/app/ajustes")]
[Produces("application/json")]
public sealed class AjustesController(IAjustesAppService ajustes) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AjustesOrganizacionDto>> Get(CancellationToken ct)
        => Ok(await ajustes.GetAsync(ct));

    [HttpPost("categorias")]
    public async Task<ActionResult<AjustesOrganizacionDto>> CrearCategoria([FromBody] DescripcionDto dto, CancellationToken ct)
        => Ok(await ajustes.CrearCategoriaAsync(dto, ct));

    [HttpPut("categorias/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> RenombrarCategoria(int id, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await ajustes.RenombrarCategoriaAsync(id, dto, ct));

    /// <summary>Borra la categoría con sus estados y tipos de trabajo (409 si algo los usa).</summary>
    [HttpDelete("categorias/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> EliminarCategoria(int id, CancellationToken ct)
        => Resultado(await ajustes.EliminarCategoriaAsync(id, ct));

    [HttpPost("categorias/{idCategoria:int}/estados")]
    public async Task<ActionResult<AjustesOrganizacionDto>> CrearEstado(int idCategoria, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await ajustes.CrearEstadoAsync(idCategoria, dto, ct));

    [HttpPut("estados/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> RenombrarEstado(int id, [FromBody] DescripcionDto dto, CancellationToken ct)
        => Resultado(await ajustes.RenombrarEstadoAsync(id, dto, ct));

    [HttpDelete("estados/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> EliminarEstado(int id, CancellationToken ct)
        => Resultado(await ajustes.EliminarEstadoAsync(id, ct));

    [HttpPost("categorias/{idCategoria:int}/tipos-trabajo")]
    public async Task<ActionResult<AjustesOrganizacionDto>> CrearTipoTrabajo(int idCategoria, [FromBody] TipoTrabajoGuardarDto dto, CancellationToken ct)
        => Resultado(await ajustes.CrearTipoTrabajoAsync(idCategoria, dto, ct));

    /// <summary>Renombra el tipo y, si viene IdsEstadoOrden, define por qué estados de orden pasa (vacío = todos).</summary>
    [HttpPut("tipos-trabajo/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> GuardarTipoTrabajo(int id, [FromBody] TipoTrabajoGuardarDto dto, CancellationToken ct)
        => Resultado(await ajustes.GuardarTipoTrabajoAsync(id, dto, ct));

    [HttpDelete("tipos-trabajo/{id:int}")]
    public async Task<ActionResult<AjustesOrganizacionDto>> EliminarTipoTrabajo(int id, CancellationToken ct)
        => Resultado(await ajustes.EliminarTipoTrabajoAsync(id, ct));

    private ActionResult<AjustesOrganizacionDto> Resultado(AjustesOrganizacionDto? dto) => dto is null ? NotFound() : Ok(dto);
}
