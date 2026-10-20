using Microsoft.AspNetCore.Mvc;
using TallerApp.DTOs;
using TallerApp.Interfaces;

namespace TallerApp.Controllers;

[Route("api/mecanicos")]
public class MecanicosController(IMecanicoService mecanicos) : TallerControllerBase
{
    // GET /api/mecanicos
    [HttpGet]
    public IActionResult Listar() => Ok(mecanicos.Listar(TallerId));

    // POST /api/mecanicos
    [HttpPost]
    public IActionResult Crear(MecanicoDto dto)
    {
        var creado = mecanicos.Agregar(TallerId, dto);
        return Created($"/api/mecanicos/{creado.Id}", creado);
    }

    // DELETE /api/mecanicos/3   ->   409 si tiene trabajos asignados
    [HttpDelete("{id}")]
    public IActionResult Eliminar(int id) =>
        Responder(mecanicos.Eliminar(TallerId, id), _ => NoContent());            // 204 · 404 · 409
}
