using System.Security.Claims;
using System.Text;
using Mantenia.Api.Configuration;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Mantenia.Api.Services;

public sealed class TokenService(IOptions<JwtOptions> options) : ITokenService
{
    private readonly JsonWebTokenHandler _handler = new();

    public TokenGenerado CrearToken(Usuario usuario, string? rol)
    {
        var jwt = options.Value;
        var ahora = DateTime.UtcNow;
        var expira = ahora.AddHours(jwt.ExpiracionHoras);

        var claims = new List<Claim>
        {
            new(AppClaims.IdUsuario, usuario.IdUsuario.ToString()),
            new(AppClaims.Email, usuario.Email ?? string.Empty),
            new(AppClaims.Nombre, $"{usuario.Nombre} {usuario.Apellido}".Trim()),
            new("jti", Guid.NewGuid().ToString()),
        };
        if (usuario.IdOrganizacion is int idOrganizacion)
        {
            claims.Add(new(AppClaims.IdOrganizacion, idOrganizacion.ToString()));
        }
        if (!string.IsNullOrWhiteSpace(rol))
        {
            // Informativo: los permisos se validan con el rol leído de la base en cada request (ver Permisos.cs).
            claims.Add(new(AppClaims.Rol, rol));
        }

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = jwt.Issuer,
            Audience = jwt.Audience,
            IssuedAt = ahora,
            NotBefore = ahora,
            Expires = expira,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                SecurityAlgorithms.HmacSha256),
        };

        return new TokenGenerado(_handler.CreateToken(descriptor), expira);
    }
}

/// <summary>Nombres de los claims que viajan en el token.</summary>
public static class AppClaims
{
    public const string IdUsuario = "sub";
    public const string Email = "email";
    public const string Nombre = "name";
    public const string Rol = "role";
    public const string IdOrganizacion = "id_organizacion";
}
