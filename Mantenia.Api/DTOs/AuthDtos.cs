using System.ComponentModel.DataAnnotations;

namespace Mantenia.Api.DTOs;

public sealed class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Clave { get; set; } = string.Empty;
}

public sealed record LoginResponseDto(string Token, DateTime ExpiraUtc);

/// <summary>Alta de usuario (se usa desde Scalar para crear usuarios con la clave hasheada).</summary>
public sealed class RegistroDto
{
    public int? IdOrganizacion { get; set; }

    public int? IdRol { get; set; }

    [Required]
    [StringLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Apellido { get; set; }

    [Required]
    [StringLength(150)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Telefono { get; set; }

    /// <summary>Contraseña en texto plano; se guarda hasheada.</summary>
    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Clave { get; set; } = string.Empty;
}

public sealed class CambiarClaveDto
{
    [Required]
    public string ClaveActual { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string NuevaClave { get; set; } = string.Empty;
}

/// <summary>Datos del usuario logueado (sin la clave).</summary>
public sealed record UsuarioDto(
    int IdUsuario,
    int? IdOrganizacion,
    int? IdRol,
    string? Nombre,
    string? Apellido,
    string? Email,
    string? Telefono,
    bool? Activo);
