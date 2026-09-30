using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace Mantenia.Api.Services;

/// <summary>
/// Hash de claves con el PasswordHasher de ASP.NET Core Identity
/// (PBKDF2 + HMAC-SHA512, salt aleatorio, 100.000 iteraciones). El resultado ocupa ~84 caracteres.
/// </summary>
public sealed class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<Usuario> _hasher = new();

    public string Hash(Usuario usuario, string clave) => _hasher.HashPassword(usuario, clave);

    public bool Verificar(Usuario usuario, string hash, string clave)
    {
        try
        {
            return _hasher.VerifyHashedPassword(usuario, hash, clave) != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            // El valor guardado no es un hash válido (por ejemplo, una clave cargada en texto plano).
            return false;
        }
    }
}
