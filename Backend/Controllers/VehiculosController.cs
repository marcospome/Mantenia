using Microsoft.AspNetCore.Mvc;
using TallerApp.DTOs;
using TallerApp.Interfaces;

namespace TallerApp.Controllers;

// ABM de Vehículos (alta, baja, modificación, listado) y alta de sus trabajos.
[Route("api/vehiculos")]
public class VehiculosController(IVehiculoService vehiculos, ITrabajoService trabajos) : TallerControllerBase
{
    // GET /api/vehiculos?patente=&propietario=   ->   LISTAR + buscar por 2 campos
    [HttpGet]
    public IActionResult Listar(string? patente, string? propietario) =>
        Ok(vehiculos.Listar(TallerId, patente, propietario));

    // GET /api/vehiculos/5   ->   un vehículo con sus trabajos
    [HttpGet("{id}")]
    public IActionResult Obtener(int id)
    {
        var vehiculo = vehiculos.Obtener(TallerId, id);
        return vehiculo is null ? NotFound() : Ok(vehiculo);                             // 404 o 200
    }

    // POST /api/vehiculos   ->   ALTA
    [HttpPost]
    public IActionResult Crear(VehiculoDto dto) =>
        Responder(vehiculos.Crear(TallerId, dto), v => Created($"/api/vehiculos/{v.Id}", v));     // 201 · 409

    // PUT /api/vehiculos/5   ->   MODIFICACIÓN
    [HttpPut("{id}")]
    public IActionResult Modificar(int id, VehiculoDto dto) =>
        Responder(vehiculos.Modificar(TallerId, id, dto), v => Ok(v));                    // 200 · 404 · 409

    // DELETE /api/vehiculos/5   ->   BAJA
    [HttpDelete("{id}")]
    public IActionResult Eliminar(int id) =>
        Responder(vehiculos.Eliminar(TallerId, id), _ => NoContent());                    // 204 · 404

    // POST /api/vehiculos/5/trabajos   ->   alta de un trabajo ASOCIADO al vehículo 5
    [HttpPost("{id}/trabajos")]
    public IActionResult CrearTrabajo(int id, NuevoTrabajoDto dto) =>
        Responder(trabajos.Agregar(TallerId, id, dto), t => Created("", t));              // 201 · 404
}
