using Mantenia.Api.DTOs;
using Mantenia.Api.Interfaces;
using Mantenia.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mantenia.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/auth")]
[Produces("application/json")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Inicia sesión y devuelve un JWT válido por 24 horas.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto, CancellationToken ct)
    {
        var respuesta = await authService.LoginAsync(dto, ct);
        return respuesta is null
            ? Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Credenciales inválidas",
                Detail = "El email o la clave son incorrectos, o el usuario está inactivo.",
            })
            : Ok(respuesta);
    }

    /// <summary>Crea un usuario con la clave hasheada. Solo disponible si Auth:PermitirRegistro = true.</summary>
    [HttpPost("registro")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoginResponseDto>> Registro([FromBody] RegistroDto dto, CancellationToken ct)
    {
        if (!authService.RegistroHabilitado)
        {
            return NotFound();
        }

        return Ok(await authService.RegistrarAsync(dto, ct));
    }

    /// <summary>Cambia la clave del usuario logueado.</summary>
    [HttpPost("cambiar-clave")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarClave([FromBody] CambiarClaveDto dto, CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirst(AppClaims.IdUsuario)?.Value, out var idUsuario))
        {
            return Unauthorized();
        }

        if (!await authService.CambiarClaveAsync(idUsuario, dto, ct))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "No se pudo cambiar la clave",
                Detail = "La clave actual es incorrecta.",
            });
        }

        return NoContent();
    }
}
