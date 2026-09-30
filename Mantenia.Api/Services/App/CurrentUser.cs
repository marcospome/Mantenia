using Mantenia.Api.Data;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

/// <summary>
/// Usuario del request. El id sale del token; la organización se lee de la base (una vez por request),
/// igual que el rol, para que un cambio de organización aplique sin volver a iniciar sesión.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor accessor, ManteniaDbContext db) : ICurrentUser
{
    private int? _idOrganizacion;
    private bool _organizacionLeida;

    public int IdUsuario => int.TryParse(accessor.HttpContext?.User.FindFirst(AppClaims.IdUsuario)?.Value, out var id)
        ? id
        : throw new UnauthorizedAccessException("El token no identifica al usuario.");

    public int? IdOrganizacion
    {
        get
        {
            if (!_organizacionLeida)
            {
                var idUsuario = IdUsuario;
                _idOrganizacion = db.Usuarios.AsNoTracking()
                    .Where(u => u.IdUsuario == idUsuario)
                    .Select(u => u.IdOrganizacion)
                    .FirstOrDefault();
                _organizacionLeida = true;
            }
            return _idOrganizacion;
        }
    }
}
