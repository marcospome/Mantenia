using Microsoft.AspNetCore.Mvc;
using TallerApp.Interfaces;

namespace TallerApp.Controllers;

[Route("api/panel")]
public class PanelController(IPanelService panel) : TallerControllerBase
{
    // GET /api/panel   ->   los números de la pantalla principal de este taller
    [HttpGet]
    public IActionResult Obtener() => Ok(panel.Obtener(TallerId));
}
