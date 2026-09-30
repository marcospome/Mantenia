using Mantenia.Api.DTOs.App;
using Mantenia.Api.Interfaces;
using Mantenia.Api.Services.App;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mantenia.Api.Controllers;

/// <summary>
/// Endpoints pensados para la app mobile: datos ya combinados y filtrados por la organización del usuario.
/// </summary>
[ApiController]
[Authorize]
[Route("api/app")]
[Produces("application/json")]
public sealed class AppController(
    IContextoAppService contexto,
    IDashboardAppService dashboard,
    IActivosAppService activos,
    IOrdenesAppService ordenes) : ControllerBase
{
    /// <summary>Usuario, organización, perfil (planta/taller) y textos configurados.</summary>
    [HttpGet("contexto")]
    public async Task<ActionResult<ContextoDto>> Contexto(CancellationToken ct)
    {
        var dto = await contexto.GetContextoAsync(ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Listas para los formularios (categorías, clientes, tipos de trabajo, prioridades, estados...).</summary>
    [HttpGet("catalogos")]
    public async Task<ActionResult<CatalogosDto>> Catalogos(CancellationToken ct)
        => Ok(await contexto.GetCatalogosAsync(ct));

    /// <summary>Pantalla de inicio: resumen, alerta predictiva, próximas órdenes y trabajos en curso.</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> Dashboard(CancellationToken ct)
        => Ok(await dashboard.GetAsync(ct));

    /// <summary>Reporte de los últimos N meses.</summary>
    [HttpGet("reportes")]
    public async Task<ActionResult<ReporteDto>> Reportes([FromQuery] int meses = 6, CancellationToken ct = default)
        => Ok(await dashboard.GetReporteAsync(meses, ct));

    /// <summary>Activos con indicadores de salud. filtro: todos | riesgo | revisar | detenidos.</summary>
    [HttpGet("activos")]
    public async Task<ActionResult<ActivosListadoDto>> Activos(
        [FromQuery] string? buscar, [FromQuery] string? filtro, CancellationToken ct)
        => Ok(await activos.ListarAsync(buscar, filtro, ct));

    /// <summary>Ficha del activo con su historial de órdenes.</summary>
    [HttpGet("activos/{id:int}")]
    public async Task<ActionResult<ActivoFichaDto>> Ficha(int id, CancellationToken ct)
    {
        var dto = await activos.GetFichaAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Campos editables del activo, para el formulario de edición.</summary>
    [HttpGet("activos/{id:int}/edicion")]
    public async Task<ActionResult<ActivoEdicionDto>> ActivoEdicion(int id, CancellationToken ct)
    {
        var dto = await activos.GetEdicionAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost("activos")]
    [Authorize(Policy = Politicas.GestionarActivos)]
    public async Task<ActionResult<ActivoEdicionDto>> CrearActivo([FromBody] ActivoGuardarDto dto, CancellationToken ct)
    {
        var creado = await activos.CrearAsync(dto, ct);
        return CreatedAtAction(nameof(Ficha), new { id = creado.IdActivo }, creado);
    }

    [HttpPut("activos/{id:int}")]
    [Authorize(Policy = Politicas.GestionarActivos)]
    public async Task<ActionResult<ActivoEdicionDto>> GuardarActivo(int id, [FromBody] ActivoGuardarDto dto, CancellationToken ct)
    {
        var guardado = await activos.GuardarAsync(id, dto, ct);
        return guardado is null ? NotFound() : Ok(guardado);
    }

    /// <summary>Elimina el activo (409 si tiene órdenes en su historial).</summary>
    [HttpDelete("activos/{id:int}")]
    [Authorize(Policy = Politicas.GestionarActivos)]
    public async Task<IActionResult> EliminarActivo(int id, CancellationToken ct)
        => await activos.EliminarAsync(id, ct) ? NoContent() : NotFound();

    /// <summary>Alta rápida de cliente; queda en la organización del usuario.</summary>
    [HttpPost("clientes")]
    [Authorize(Policy = Politicas.GestionarActivos)]
    public async Task<ActionResult<ClienteDto>> CrearCliente([FromBody] ClienteCrearDto dto, CancellationToken ct)
        => Ok(await activos.CrearClienteAsync(dto, ct));

    /// <summary>Busca un activo por el código leído del QR (Identificador) o ingresado a mano.</summary>
    [HttpGet("activos/codigo/{**codigo}")]
    [Authorize(Policy = Politicas.EscanearQr)]
    public async Task<ActionResult<CodigoEncontradoDto>> PorCodigo(string codigo, CancellationToken ct)
    {
        var dto = await activos.BuscarPorCodigoAsync(codigo, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Órdenes de trabajo. estado: abiertas | cerradas | todas.</summary>
    [HttpGet("ordenes")]
    public async Task<ActionResult<IReadOnlyList<OrdenResumenDto>>> Ordenes(
        [FromQuery] string? estado, [FromQuery] int? idActivo, CancellationToken ct)
        => Ok(await ordenes.ListarAsync(estado, idActivo, ct));

    [HttpGet("ordenes/{id:int}")]
    public async Task<ActionResult<OrdenDetalleDto>> Orden(int id, CancellationToken ct)
    {
        var dto = await ordenes.GetDetalleAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    /// <summary>Crea una orden (con repuestos) a nombre del usuario logueado.</summary>
    [HttpPost("ordenes")]
    [Authorize(Policy = Politicas.CrearOrden)]
    public async Task<ActionResult<OrdenDetalleDto>> CrearOrden([FromBody] NuevaOrdenDto dto, CancellationToken ct)
    {
        var creada = await ordenes.CrearAsync(dto, ct);
        return creada is null
            ? NotFound()
            : CreatedAtAction(nameof(Orden), new { id = creada.Orden.IdOrdenTrabajo }, creada);
    }

    /// <summary>Cambia el estado. Completa FechaInicio / FechaCierre según corresponda.</summary>
    [HttpPut("ordenes/{id:int}/estado")]
    [Authorize(Policy = Politicas.GestionarOrdenes)]
    public async Task<ActionResult<OrdenDetalleDto>> CambiarEstado(int id, [FromBody] CambioEstadoDto dto, CancellationToken ct)
    {
        var actualizada = await ordenes.CambiarEstadoAsync(id, dto, ct);
        return actualizada is null ? NotFound() : Ok(actualizada);
    }

    /// <summary>Agrega un repuesto (detalle) a la orden. Devuelve la orden actualizada.</summary>
    [HttpPost("ordenes/{id:int}/repuestos")]
    [Authorize(Policy = Politicas.GestionarOrdenes)]
    public async Task<ActionResult<OrdenDetalleDto>> AgregarRepuesto(int id, [FromBody] RepuestoInputDto dto, CancellationToken ct)
    {
        var orden = await ordenes.AgregarRepuestoAsync(id, dto, ct);
        return orden is null ? NotFound() : Ok(orden);
    }

    [HttpPut("ordenes/repuestos/{idDetalle:int}")]
    [Authorize(Policy = Politicas.GestionarOrdenes)]
    public async Task<ActionResult<OrdenDetalleDto>> GuardarRepuesto(int idDetalle, [FromBody] RepuestoInputDto dto, CancellationToken ct)
    {
        var orden = await ordenes.GuardarRepuestoAsync(idDetalle, dto, ct);
        return orden is null ? NotFound() : Ok(orden);
    }

    [HttpDelete("ordenes/repuestos/{idDetalle:int}")]
    [Authorize(Policy = Politicas.GestionarOrdenes)]
    public async Task<ActionResult<OrdenDetalleDto>> EliminarRepuesto(int idDetalle, CancellationToken ct)
    {
        var orden = await ordenes.EliminarRepuestoAsync(idDetalle, ct);
        return orden is null ? NotFound() : Ok(orden);
    }
}
