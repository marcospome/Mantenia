using Microsoft.AspNetCore.Mvc;
using TallerApp.Interfaces;

namespace TallerApp.Controllers;

[Route("api/trabajos")]
public class TrabajosController(ITrabajoService trabajos) : TallerControllerBase
{
    // GET /api/trabajos/tipos   ->   el catálogo que llena el combo «tipo de trabajo»
    [HttpGet("tipos")]
    public IActionResult ListarTipos() => Ok(trabajos.ListarTipos());

    // POST /api/trabajos/7/avanzar   ->   pasa al siguiente estado (Pendiente -> En curso -> Finalizado)
    [HttpPost("{id}/avanzar")]
    public IActionResult Avanzar(int id) =>
        Responder(trabajos.Avanzar(TallerId, id), t => Ok(t));                    // 200 · 404 · 409
}
