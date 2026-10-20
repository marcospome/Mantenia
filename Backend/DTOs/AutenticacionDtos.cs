using System.ComponentModel.DataAnnotations;

namespace TallerApp.DTOs;

// Lo que el front manda para iniciar sesión
public class LoginDto
{
    [Required(ErrorMessage = "El usuario es obligatorio")]
    public string? Usuario { get; set; }

    [Required(ErrorMessage = "La clave es obligatoria")]
    public string? Clave { get; set; }
}

// Lo que el front manda para dar de alta un taller nuevo
public class RegistroDto
{
    [Required(ErrorMessage = "El nombre del taller es obligatorio")]
    public string? NombreTaller { get; set; }

    [Required(ErrorMessage = "El usuario es obligatorio")]
    [MinLength(3, ErrorMessage = "El usuario debe tener al menos 3 caracteres")]
    public string? Usuario { get; set; }

    [Required(ErrorMessage = "La clave es obligatoria")]
    [MinLength(6, ErrorMessage = "La clave debe tener al menos 6 caracteres")]
    public string? Clave { get; set; }
}

// Quién inició sesión y de qué taller es (lo devuelve el servicio de autenticación)
public record SesionDto(string Usuario, int TallerId, string Taller);

// Lo que SALE del login: el token y los datos para mostrar en pantalla
public record LoginRespuestaDto(string Token, string Usuario, string Taller);
