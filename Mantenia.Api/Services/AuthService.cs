using Mantenia.Api.Common;
using Mantenia.Api.Configuration;
using Mantenia.Api.Data;
using Mantenia.Api.DTOs;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Mantenia.Api.Services;

/// <summary>Login, alta de usuarios (con la clave hasheada) y cambio de clave.</summary>
public sealed class AuthService(
    ManteniaDbContext db,
    IPasswordHasherService passwordHasher,
    ITokenService tokenService,
    IOptions<AuthOptions> authOptions) : IAuthService
{
    public bool RegistroHabilitado => authOptions.Value.PermitirRegistro;

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim();
        var usuario = await db.Usuarios.AsNoTracking().Include(u => u.Rol).FirstOrDefaultAsync(u => u.Email == email, ct);

        if (usuario is null
            || usuario.Activo == false
            || string.IsNullOrEmpty(usuario.ClaveHash)
            || !passwordHasher.Verificar(usuario, usuario.ClaveHash, dto.Clave))
        {
            return null;
        }

        return CrearRespuesta(usuario);
    }

    public async Task<LoginResponseDto> RegistrarAsync(RegistroDto dto, CancellationToken ct = default)
    {
        var email = dto.Email.Trim();
        if (await db.Usuarios.AnyAsync(u => u.Email == email, ct))
        {
            throw new ConflictException($"Ya existe un usuario con el email '{email}'.");
        }

        var usuario = new Usuario
        {
            IdOrganizacion = dto.IdOrganizacion,
            IdRol = dto.IdRol,
            Nombre = dto.Nombre.Trim(),
            Apellido = dto.Apellido?.Trim(),
            Email = email,
            Telefono = dto.Telefono?.Trim(),
            Activo = true,
        };
        usuario.ClaveHash = passwordHasher.Hash(usuario, dto.Clave);

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        await db.Entry(usuario).Reference(u => u.Rol).LoadAsync(ct);
        return CrearRespuesta(usuario);
    }

    /// <summary>Devuelve false si el usuario no existe o la clave actual no coincide.</summary>
    public async Task<bool> CambiarClaveAsync(int idUsuario, CambiarClaveDto dto, CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.IdUsuario == idUsuario, ct);
        if (usuario is null
            || string.IsNullOrEmpty(usuario.ClaveHash)
            || !passwordHasher.Verificar(usuario, usuario.ClaveHash, dto.ClaveActual))
        {
            return false;
        }

        usuario.ClaveHash = passwordHasher.Hash(usuario, dto.NuevaClave);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private LoginResponseDto CrearRespuesta(Usuario usuario)
    {
        var token = tokenService.CrearToken(usuario, usuario.Rol?.Descripcion);
        return new LoginResponseDto(token.Token, token.ExpiraUtc);
    }
}
