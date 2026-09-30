using Mantenia.Api.Data;
using Mantenia.Api.DTOs;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

public sealed class ContextoAppService(
    ManteniaDbContext db,
    ICurrentUser usuarioActual,
    DatosOrganizacion datos) : IContextoAppService
{
    private static readonly string[] PalabrasTaller = ["taller", "mecán", "mecan", "automot", "vehic", "vehíc"];

    public async Task<ContextoDto?> GetContextoAsync(CancellationToken ct = default)
    {
        var usuario = await db.Usuarios.AsNoTracking()
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.IdUsuario == usuarioActual.IdUsuario, ct);
        if (usuario is null)
        {
            return null;
        }

        Organizacion? organizacion = null;
        var labels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? plan = null;

        if (usuario.IdOrganizacion is int idOrg)
        {
            organizacion = await db.Organizaciones.AsNoTracking()
                .Include(o => o.TipoOrganizacion)
                .FirstOrDefaultAsync(o => o.IdOrganizacion == idOrg, ct);

            if (organizacion?.IdTipoOrganizacion is int idTipo)
            {
                var filas = await db.LabelsTipoOrganizacionModulo.AsNoTracking()
                    .Where(l => l.TipoOrganizacionModulo != null && l.TipoOrganizacionModulo.IdTipoOrganizacion == idTipo)
                    .Select(l => new { l.Clave, l.Valor })
                    .ToListAsync(ct);

                foreach (var fila in filas.Where(f => !string.IsNullOrWhiteSpace(f.Clave) && f.Valor is not null))
                {
                    labels[fila.Clave!] = fila.Valor!;
                }
            }

            var hoy = DateTime.Now;
            plan = await db.Suscripciones.AsNoTracking()
                .Where(s => s.IdOrganizacion == idOrg && (s.FechaFin == null || s.FechaFin >= hoy))
                .OrderByDescending(s => s.FechaInicio)
                .Select(s => s.Plan!.Descripcion)
                .FirstOrDefaultAsync(ct);
        }

        var tipo = organizacion?.TipoOrganizacion?.Descripcion;
        var perfil = labels.TryGetValue("perfil", out var perfilLabel) && perfilLabel is "taller" or "planta"
            ? perfilLabel
            : tipo is not null && PalabrasTaller.Any(p => tipo.Contains(p, StringComparison.OrdinalIgnoreCase)) ? "taller" : "planta";

        // Claves de las acciones permitidas (tabla RolAccion). Sistemas tiene todas.
        var rol = usuario.Rol?.Descripcion?.Trim();
        var permisos = Roles.EsSistemas(rol)
            ? Acciones.Todas.ToList()
            : await db.RolesAcciones.AsNoTracking()
                .Where(ra => ra.IdRol == usuario.IdRol && ra.Accion!.Clave != null)
                .Select(ra => ra.Accion!.Clave!)
                .Distinct()
                .ToListAsync(ct);

        return new ContextoDto(
            new UsuarioDto(
                usuario.IdUsuario, usuario.IdOrganizacion, usuario.IdRol, usuario.Nombre, usuario.Apellido,
                usuario.Email, usuario.Telefono, usuario.Activo),
            usuario.Rol?.Descripcion,
            organizacion?.IdOrganizacion,
            organizacion?.RazonSocial,
            organizacion?.Logo,
            tipo,
            perfil,
            plan,
            labels,
            Roles.PuedeAjustes(rol),
            Roles.EsSistemas(rol),
            permisos);
    }

    public async Task<CatalogosDto> GetCatalogosAsync(CancellationToken ct = default)
    {
        var org = usuarioActual.IdOrganizacion;

        var categorias = await db.CategoriasActivo.AsNoTracking()
            .Where(c => org != null && c.IdOrganizacion == org)
            .OrderBy(c => c.Descripcion)
            .Select(c => new ItemDto(c.IdCategoriaActivo, c.Descripcion ?? "", null, null))
            .ToListAsync(ct);
        var idsCategorias = categorias.Select(c => (int?)c.Id).ToList();

        var estadosActivo = await db.EstadosActivo.AsNoTracking()
            .Where(e => e.IdCategoriaActivo == null || idsCategorias.Contains(e.IdCategoriaActivo))
            .OrderBy(e => e.Descripcion)
            .Select(e => new ItemDto(e.IdEstadoActivo, e.Descripcion ?? "", e.IdCategoriaActivo, null))
            .ToListAsync(ct);

        var clientes = await db.Clientes.AsNoTracking()
            .Where(c => org != null && c.IdOrganizacion == org)
            .OrderBy(c => c.Nombre).ThenBy(c => c.Apellido)
            .Select(c => new ItemDto(c.IdCliente, ((c.Nombre ?? "") + " " + (c.Apellido ?? "")).Trim(), null, c.Telefono))
            .ToListAsync(ct);

        // Ubicacion no tiene organización: se ofrecen las que ya usan los activos de la organización
        var idsUbicaciones = datos.ActivosQuery().Where(a => a.IdUbicacion != null).Select(a => a.IdUbicacion);
        var ubicaciones = await db.Ubicaciones.AsNoTracking()
            .Where(u => idsUbicaciones.Contains(u.IdUbicacion))
            .OrderBy(u => u.Direccion)
            .Select(u => new ItemDto(
                u.IdUbicacion,
                (u.Direccion ?? "") + (u.Localidad != null ? ", " + u.Localidad.Descripcion : ""),
                null, null))
            .Take(500)
            .ToListAsync(ct);

        var tiposTrabajo = await db.TiposTrabajo.AsNoTracking()
            .Where(t => t.IdCategoriaActivo == null || idsCategorias.Contains(t.IdCategoriaActivo))
            .OrderBy(t => t.Descripcion)
            .Select(t => new ItemDto(t.IdTipoTrabajo, t.Descripcion ?? "", t.IdCategoriaActivo, null))
            .ToListAsync(ct);

        var prioridades = await db.Prioridades.AsNoTracking()
            .OrderBy(p => p.IdPrioridad)
            .Select(p => new ItemDto(p.IdPrioridad, p.Descripcion ?? "", null, null))
            .ToListAsync(ct);

        var estadosOrden = await db.EstadosOrden.AsNoTracking()
            .OrderBy(e => e.IdEstadoOrden)
            .Select(e => new ItemDto(e.IdEstadoOrden, e.Descripcion ?? "", null, e.EsFinal == true ? "final" : null))
            .ToListAsync(ct);

        return new CatalogosDto(categorias, estadosActivo, clientes, ubicaciones, tiposTrabajo, prioridades, estadosOrden);
    }
}
