using Mantenia.Api.DTOs;

namespace Mantenia.Api.Interfaces;

public interface IAuthService
{
    bool RegistroHabilitado { get; }

    /// <summary>Devuelve null si las credenciales son inválidas o el usuario está inactivo.</summary>
    Task<LoginResponseDto?> LoginAsync(LoginDto dto, CancellationToken ct = default);

    Task<LoginResponseDto> RegistrarAsync(RegistroDto dto, CancellationToken ct = default);

    /// <summary>Cambia la clave verificando la actual. Devuelve false si el usuario no existe o la clave actual no coincide.</summary>
    Task<bool> CambiarClaveAsync(int idUsuario, CambiarClaveDto dto, CancellationToken ct = default);
}
