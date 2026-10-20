using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Services;

namespace TallerApp.Controllers;

// CONTROLLER: recibe el pedido HTTP, llama a la capa de Negocio y devuelve la respuesta. No tiene reglas propias.
// Este es el único controller SIN login (porque justamente es el que lo da).
[ApiController]
[Route("api/autenticacion")]
public class AutenticacionController(IAutenticacionService autenticacion, IConfiguration configuracion) : ControllerBase
{
    // POST /api/autenticacion/login   ->   { token, usuario, taller }
    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var sesion = autenticacion.Validar(dto.Usuario!, dto.Clave!);
        return sesion is null
            ? Unauthorized(new { mensaje = "Usuario o clave incorrectos" })          // 401
            : Ok(CrearRespuesta(sesion));                                            // 200
    }

    // POST /api/autenticacion/registro   ->   da de alta un taller nuevo y entra directo
    [HttpPost("registro")]
    public IActionResult Registro(RegistroDto dto)
    {
        var resultado = autenticacion.Registrar(dto);
        return resultado.Tipo == TipoResultado.Conflicto
            ? Conflict(new { mensaje = resultado.Mensaje })                          // 409: el usuario ya existe
            : Ok(CrearRespuesta(resultado.Valor!));
    }

    // El token es una "pulsera": lleva el usuario y el TALLER, vence en 8 horas y va firmada con la clave secreta
    private LoginRespuestaDto CrearRespuesta(SesionDto sesion)
    {
        var credenciales = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuracion["Jwt:Key"]!)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: [new Claim(ClaimTypes.Name, sesion.Usuario), new Claim("tallerId", sesion.TallerId.ToString())],
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciales);

        return new LoginRespuestaDto(new JwtSecurityTokenHandler().WriteToken(token), sesion.Usuario, sesion.Taller);
    }
}
