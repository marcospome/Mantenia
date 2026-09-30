using Mantenia.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

/// <summary>Descripciones de la tabla Rol con permisos especiales.</summary>
public static class Roles
{
    /// <summary>Equipo de sistemas de MantenIA: configura lo general (por tipo de organización y global).</summary>
    public const string Sistemas = "Sistemas";

    /// <summary>Administrador de una organización: configura los catálogos propios de su organización.</summary>
    public const string Administrador = "Administrador";

    public static bool EsSistemas(string? rol) => string.Equals(rol, Sistemas, StringComparison.OrdinalIgnoreCase);

    public static bool PuedeAjustes(string? rol)
        => EsSistemas(rol) || string.Equals(rol, Administrador, StringComparison.OrdinalIgnoreCase);
}

/// <summary>
/// Claves de la tabla Accion que la API aplica. Cada una se asigna a los roles desde Sistemas (tabla RolAccion).
/// </summary>
public static class Acciones
{
    public const string EscanearQr = "escanear.qr";
    public const string CrearOrden = "ordenes.crear";
    public const string GestionarOrdenes = "ordenes.gestionar";
    public const string GestionarActivos = "activos.gestionar";
    public const string ExportarReportes = "reportes.exportar";

    public static readonly string[] Todas = [EscanearQr, CrearOrden, GestionarOrdenes, GestionarActivos, ExportarReportes];
}

public static class Politicas
{
    public const string Sistemas = "Sistemas";
    public const string AjustesOrganizacion = "AjustesOrganizacion";

    /// <summary>Nombre de la política que exige una acción, ej. "Permiso:ordenes.crear".</summary>
    public const string Prefijo = "Permiso:";
    public const string CrearOrden = Prefijo + Acciones.CrearOrden;
    public const string GestionarOrdenes = Prefijo + Acciones.GestionarOrdenes;
    public const string GestionarActivos = Prefijo + Acciones.GestionarActivos;
    public const string EscanearQr = Prefijo + Acciones.EscanearQr;
}

/// <summary>Exige que el rol del usuario tenga la acción indicada (Sistemas las tiene todas).</summary>
public sealed class PermisoRequerido(string clave) : IAuthorizationRequirement
{
    public string Clave { get; } = clave;
}

public sealed class PermisoRequeridoHandler(ManteniaDbContext db) : AuthorizationHandler<PermisoRequerido>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermisoRequerido requirement)
    {
        if (!int.TryParse(context.User.FindFirst(AppClaims.IdUsuario)?.Value, out var idUsuario))
        {
            return;
        }

        var usuario = await db.Usuarios.AsNoTracking()
            .Where(u => u.IdUsuario == idUsuario && u.Activo != false)
            .Select(u => new { u.IdRol, Rol = u.Rol!.Descripcion })
            .FirstOrDefaultAsync();
        if (usuario is null)
        {
            return;
        }

        if (Roles.EsSistemas(usuario.Rol?.Trim())
            || await db.RolesAcciones.AnyAsync(ra => ra.IdRol == usuario.IdRol && ra.Accion!.Clave == requirement.Clave))
        {
            context.Succeed(requirement);
        }
    }
}

/// <summary>Exige que el usuario tenga alguno de los roles indicados.</summary>
public sealed class RolRequerido(params string[] roles) : IAuthorizationRequirement
{
    public IReadOnlyList<string> Roles { get; } = roles;
}

/// <summary>
/// Lee el rol desde la base en cada request (no del token), para que un cambio de rol
/// tenga efecto sin volver a iniciar sesión.
/// </summary>
public sealed class RolRequeridoHandler(ManteniaDbContext db) : AuthorizationHandler<RolRequerido>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, RolRequerido requirement)
    {
        if (!int.TryParse(context.User.FindFirst(AppClaims.IdUsuario)?.Value, out var idUsuario))
        {
            return;
        }

        var rol = await db.Usuarios.AsNoTracking()
            .Where(u => u.IdUsuario == idUsuario && u.Activo != false)
            .Select(u => u.Rol!.Descripcion)
            .FirstOrDefaultAsync();

        if (rol is not null && requirement.Roles.Any(r => string.Equals(r, rol.Trim(), StringComparison.OrdinalIgnoreCase)))
        {
            context.Succeed(requirement);
        }
    }
}
