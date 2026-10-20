using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TallerApp.Services;

namespace TallerApp.Controllers;

// Base de todos los controllers que requieren login. Lo que se escribe acá lo heredan los demás.
//  [ApiController]: valida solo las data annotations de los DTOs (si falla, responde 400 antes de entrar al método).
//  [Authorize]: exige el token; sin token válido, 401.
[ApiController]
[Authorize]
public abstract class TallerControllerBase : ControllerBase
{
    // El taller de quien hace el pedido. Sale del TOKEN, nunca de lo que manda el cliente:
    // por eso un taller no puede pedir datos de otro.
    protected int TallerId => int.Parse(User.FindFirst("tallerId")!.Value);

    // Traduce lo que devolvió un servicio a un código HTTP
    protected IActionResult Responder<T>(Resultado<T> resultado, Func<T, IActionResult> correcto) => resultado.Tipo switch
    {
        TipoResultado.NoEncontrado => NotFound(new { mensaje = resultado.Mensaje }),    // 404
        TipoResultado.Conflicto => Conflict(new { mensaje = resultado.Mensaje }),       // 409
        _ => correcto(resultado.Valor!),
    };
}
