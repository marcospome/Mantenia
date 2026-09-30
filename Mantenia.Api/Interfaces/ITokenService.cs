using Mantenia.Api.Entities;

namespace Mantenia.Api.Interfaces;

public sealed record TokenGenerado(string Token, DateTime ExpiraUtc);

public interface ITokenService
{
    TokenGenerado CrearToken(Usuario usuario, string? rol);
}
