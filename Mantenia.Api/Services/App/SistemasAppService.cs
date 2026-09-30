using Mantenia.Api.Common;
using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;
using static Mantenia.Api.Services.App.AjustesAppService;

namespace Mantenia.Api.Services.App;

/// <summary>
/// Configuración general, solo para el rol Sistemas: tipos de organización (módulos y textos)
/// y catálogos globales que comparten todas las organizaciones.
/// </summary>
public sealed class SistemasAppService(ManteniaDbContext db) : ISistemasAppService
{
    public async Task<SistemasDto> GetAsync(CancellationToken ct = default)
    {
        var tipos = await db.TiposOrganizacion.AsNoTracking()
            .OrderBy(t => t.Descripcion)
            .Select(t => new
            {
                t.IdTipoOrganizacion,
                t.Descripcion,
                t.Activo,
                Organizaciones = db.Organizaciones.Count(o => o.IdTipoOrganizacion == t.IdTipoOrganizacion),
            })
            .ToListAsync(ct);

        var modulosTipo = await db.TiposOrganizacionModulo.AsNoTracking()
            .Where(m => m.IdTipoOrganizacion != null && m.IdModulo != null)
            .Select(m => new { m.IdTipoOrganizacionModulo, IdTipo = m.IdTipoOrganizacion!.Value, IdModulo = m.IdModulo!.Value })
            .ToListAsync(ct);

        var labels = await db.LabelsTipoOrganizacionModulo.AsNoTracking()
            .Where(l => l.TipoOrganizacionModulo != null && l.TipoOrganizacionModulo.IdModulo != null)
            .OrderBy(l => l.Clave)
            .Select(l => new
            {
                IdTipo = l.TipoOrganizacionModulo!.IdTipoOrganizacion,
                Dto = new LabelDto(l.IdLabelTipoOrganizacionModulo, l.TipoOrganizacionModulo.IdModulo!.Value, l.Clave ?? "", l.Valor ?? ""),
            })
            .ToListAsync(ct);

        var modulos = await db.Modulos.AsNoTracking()
            .OrderBy(m => m.IdModulo)
            .Select(m => new ItemDto(m.IdModulo, m.Descripcion ?? "", null, m.Activo == false ? "inactivo" : null))
            .ToListAsync(ct);

        var estadosOrden = await db.EstadosOrden.AsNoTracking()
            .OrderBy(e => e.IdEstadoOrden)
            .Select(e => new EstadoOrdenSistemasDto(
                e.IdEstadoOrden, e.Descripcion ?? "", e.EsFinal == true, db.OrdenesTrabajo.Count(o => o.IdEstadoOrden == e.IdEstadoOrden)))
            .ToListAsync(ct);

        var prioridades = await db.Prioridades.AsNoTracking()
            .OrderBy(p => p.IdPrioridad)
            .Select(p => new ItemAjusteDto(p.IdPrioridad, p.Descripcion ?? "", db.OrdenesTrabajo.Count(o => o.IdPrioridad == p.IdPrioridad)))
            .ToListAsync(ct);

        var generales = await db.EstadosActivo.AsNoTracking()
            .Where(e => e.IdCategoriaActivo == null)
            .OrderBy(e => e.Descripcion)
            .Select(e => new ItemAjusteDto(e.IdEstadoActivo, e.Descripcion ?? "", db.Activos.Count(a => a.IdEstadoActivo == e.IdEstadoActivo)))
            .ToListAsync(ct);

        var roles = await db.Roles.AsNoTracking()
            .OrderBy(r => r.IdRol)
            .Select(r => new
            {
                r.IdRol,
                r.Descripcion,
                Usuarios = db.Usuarios.Count(u => u.IdRol == r.IdRol),
                IdsAccion = db.RolesAcciones.Where(ra => ra.IdRol == r.IdRol && ra.IdAccion != null).Select(ra => ra.IdAccion!.Value).ToList(),
            })
            .ToListAsync(ct);

        var acciones = await db.Acciones.AsNoTracking()
            .OrderBy(a => a.IdModulo).ThenBy(a => a.IdAccion)
            .Select(a => new AccionSistemasDto(a.IdAccion, a.IdModulo, a.Descripcion ?? "", a.Clave))
            .ToListAsync(ct);

        return new SistemasDto(
            tipos.Select(t => new TipoOrganizacionSistemasDto(
                t.IdTipoOrganizacion,
                t.Descripcion ?? "",
                t.Activo != false,
                t.Organizaciones,
                modulosTipo.Where(m => m.IdTipo == t.IdTipoOrganizacion).Select(m => new ModuloTipoDto(m.IdTipoOrganizacionModulo, m.IdModulo)).ToList(),
                labels.Where(l => l.IdTipo == t.IdTipoOrganizacion).Select(l => l.Dto).ToList()))
                .ToList(),
            modulos,
            estadosOrden,
            prioridades,
            generales,
            roles.Select(r => new RolSistemasDto(
                r.IdRol,
                r.Descripcion ?? "",
                r.Usuarios,
                EsProtegido(r.Descripcion),
                Roles.EsSistemas(r.Descripcion?.Trim()),
                r.IdsAccion.Distinct().Order().ToList()))
                .ToList(),
            acciones);
    }

    // ------------------------------------------------------------ Roles y permisos

    public async Task<SistemasDto> CrearRolAsync(DescripcionDto dto, CancellationToken ct = default)
    {
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.Roles.Where(r => r.Descripcion == descripcion), "un rol", descripcion, ct);

        db.Roles.Add(new Rol { Descripcion = descripcion });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> RenombrarRolAsync(int id, DescripcionDto dto, CancellationToken ct = default)
    {
        var rol = await db.Roles.FirstOrDefaultAsync(r => r.IdRol == id, ct);
        if (rol is null)
        {
            return null;
        }

        if (EsProtegido(rol.Descripcion))
        {
            throw new ConflictException($"El rol “{rol.Descripcion}” no se puede renombrar: la API depende de ese nombre.");
        }

        var descripcion = Limpiar(dto.Descripcion);
        if (EsProtegido(descripcion))
        {
            throw new ConflictException($"“{descripcion}” es un nombre reservado.");
        }

        await ExigirUnicoAsync(db.Roles.Where(r => r.Descripcion == descripcion && r.IdRol != id), "un rol", descripcion, ct);

        rol.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> EliminarRolAsync(int id, CancellationToken ct = default)
    {
        var rol = await db.Roles.FirstOrDefaultAsync(r => r.IdRol == id, ct);
        if (rol is null)
        {
            return null;
        }

        if (EsProtegido(rol.Descripcion))
        {
            throw new ConflictException($"El rol “{rol.Descripcion}” no se puede borrar.");
        }

        var usuarios = await db.Usuarios.CountAsync(u => u.IdRol == id, ct);
        if (usuarios > 0)
        {
            throw new ConflictException($"No se puede borrar: {usuarios} usuario(s) tienen este rol. Cambiales el rol primero.");
        }

        db.RolesAcciones.RemoveRange(await db.RolesAcciones.Where(ra => ra.IdRol == id).ToListAsync(ct));
        db.Roles.Remove(rol);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    /// <summary>Deja al rol exactamente con esas acciones (tabla RolAccion).</summary>
    public async Task<SistemasDto?> GuardarPermisosRolAsync(int idRol, PermisosRolDto dto, CancellationToken ct = default)
    {
        var rol = await db.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.IdRol == idRol, ct);
        if (rol is null)
        {
            return null;
        }

        if (Roles.EsSistemas(rol.Descripcion?.Trim()))
        {
            throw new ConflictException("Sistemas tiene todos los permisos: no hace falta asignarlos.");
        }

        var deseadas = dto.IdsAccion.Distinct().ToHashSet();
        var validas = await db.Acciones.CountAsync(a => deseadas.Contains(a.IdAccion), ct);
        if (validas != deseadas.Count)
        {
            throw new ConflictException("Alguna de las acciones indicadas no existe.");
        }

        var actuales = await db.RolesAcciones.Where(ra => ra.IdRol == idRol).ToListAsync(ct);
        db.RolesAcciones.RemoveRange(actuales.Where(ra => ra.IdAccion is not int a || !deseadas.Contains(a)));
        foreach (var idAccion in deseadas.Where(a => actuales.All(ra => ra.IdAccion != a)))
        {
            db.RolesAcciones.Add(new RolAccion { IdRol = idRol, IdAccion = idAccion });
        }

        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    private static bool EsProtegido(string? descripcion)
        => Roles.EsSistemas(descripcion?.Trim()) || Roles.PuedeAjustes(descripcion?.Trim());

    // ------------------------------------------------------------ Tipos de organización

    public async Task<SistemasDto> CrearTipoAsync(TipoOrganizacionGuardarDto dto, CancellationToken ct = default)
    {
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.TiposOrganizacion.Where(t => t.Descripcion == descripcion), "un tipo de organización", descripcion, ct);

        var tipo = new TipoOrganizacion { Descripcion = descripcion, Activo = dto.Activo };
        db.TiposOrganizacion.Add(tipo);
        await db.SaveChangesAsync(ct);

        // Arranca con todos los módulos activos habilitados
        var modulos = await db.Modulos.Where(m => m.Activo != false).Select(m => m.IdModulo).ToListAsync(ct);
        db.TiposOrganizacionModulo.AddRange(modulos.Select(m => new TipoOrganizacionModulo { IdTipoOrganizacion = tipo.IdTipoOrganizacion, IdModulo = m }));
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> GuardarTipoAsync(int id, TipoOrganizacionGuardarDto dto, CancellationToken ct = default)
    {
        var tipo = await db.TiposOrganizacion.FirstOrDefaultAsync(t => t.IdTipoOrganizacion == id, ct);
        if (tipo is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.TiposOrganizacion.Where(t => t.Descripcion == descripcion && t.IdTipoOrganizacion != id), "un tipo de organización", descripcion, ct);

        tipo.Descripcion = descripcion;
        tipo.Activo = dto.Activo;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    /// <summary>Deja habilitados exactamente esos módulos. Al quitar un módulo se borran sus textos.</summary>
    public async Task<SistemasDto?> GuardarModulosAsync(int idTipo, ModulosTipoDto dto, CancellationToken ct = default)
    {
        if (!await db.TiposOrganizacion.AnyAsync(t => t.IdTipoOrganizacion == idTipo, ct))
        {
            return null;
        }

        var deseados = dto.IdsModulo.Distinct().ToHashSet();
        var validos = await db.Modulos.CountAsync(m => deseados.Contains(m.IdModulo), ct);
        if (validos != deseados.Count)
        {
            throw new ConflictException("Alguno de los módulos indicados no existe.");
        }

        var actuales = await db.TiposOrganizacionModulo.Where(m => m.IdTipoOrganizacion == idTipo).ToListAsync(ct);
        var quitar = actuales.Where(m => m.IdModulo is not int idModulo || !deseados.Contains(idModulo)).ToList();
        var idsQuitar = quitar.Select(m => (int?)m.IdTipoOrganizacionModulo).ToList();

        db.LabelsTipoOrganizacionModulo.RemoveRange(
            await db.LabelsTipoOrganizacionModulo.Where(l => idsQuitar.Contains(l.IdTipoOrganizacionModulo)).ToListAsync(ct));
        db.TiposOrganizacionModulo.RemoveRange(quitar);
        foreach (var idModulo in deseados.Where(d => actuales.All(m => m.IdModulo != d)))
        {
            db.TiposOrganizacionModulo.Add(new TipoOrganizacionModulo { IdTipoOrganizacion = idTipo, IdModulo = idModulo });
        }

        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    // ------------------------------------------------------------ Textos (labels) por tipo

    public async Task<SistemasDto?> CrearLabelAsync(int idTipo, LabelCrearDto dto, CancellationToken ct = default)
    {
        if (!await db.TiposOrganizacion.AnyAsync(t => t.IdTipoOrganizacion == idTipo, ct))
        {
            return null;
        }

        var tipoModulo = await db.TiposOrganizacionModulo
            .FirstOrDefaultAsync(m => m.IdTipoOrganizacion == idTipo && m.IdModulo == dto.IdModulo, ct)
            ?? throw new ConflictException("Ese módulo no está habilitado para este tipo de organización. Habilitalo primero.");

        var clave = Limpiar(dto.Clave);
        await ExigirUnicoAsync(
            db.LabelsTipoOrganizacionModulo.Where(l => l.TipoOrganizacionModulo!.IdTipoOrganizacion == idTipo && l.Clave == clave),
            "un texto con la clave", clave, ct);

        db.LabelsTipoOrganizacionModulo.Add(new LabelTipoOrganizacionModulo
        {
            IdTipoOrganizacionModulo = tipoModulo.IdTipoOrganizacionModulo,
            Clave = clave,
            Valor = dto.Valor.Trim(),
        });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> GuardarLabelAsync(int id, LabelGuardarDto dto, CancellationToken ct = default)
    {
        var label = await db.LabelsTipoOrganizacionModulo.Include(l => l.TipoOrganizacionModulo)
            .FirstOrDefaultAsync(l => l.IdLabelTipoOrganizacionModulo == id, ct);
        if (label is null)
        {
            return null;
        }

        var clave = Limpiar(dto.Clave);
        var idTipo = label.TipoOrganizacionModulo?.IdTipoOrganizacion;
        await ExigirUnicoAsync(
            db.LabelsTipoOrganizacionModulo.Where(l =>
                l.TipoOrganizacionModulo!.IdTipoOrganizacion == idTipo && l.Clave == clave && l.IdLabelTipoOrganizacionModulo != id),
            "un texto con la clave", clave, ct);

        label.Clave = clave;
        label.Valor = dto.Valor.Trim();
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> EliminarLabelAsync(int id, CancellationToken ct = default)
    {
        var label = await db.LabelsTipoOrganizacionModulo.FirstOrDefaultAsync(l => l.IdLabelTipoOrganizacionModulo == id, ct);
        if (label is null)
        {
            return null;
        }

        db.LabelsTipoOrganizacionModulo.Remove(label);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    // ------------------------------------------------------------ Estados de orden (globales)

    public async Task<SistemasDto> CrearEstadoOrdenAsync(EstadoOrdenGuardarDto dto, CancellationToken ct = default)
    {
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.EstadosOrden.Where(e => e.Descripcion == descripcion), "un estado de orden", descripcion, ct);

        db.EstadosOrden.Add(new EstadoOrden { Descripcion = descripcion, EsFinal = dto.EsFinal });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> GuardarEstadoOrdenAsync(int id, EstadoOrdenGuardarDto dto, CancellationToken ct = default)
    {
        var estado = await db.EstadosOrden.FirstOrDefaultAsync(e => e.IdEstadoOrden == id, ct);
        if (estado is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.EstadosOrden.Where(e => e.Descripcion == descripcion && e.IdEstadoOrden != id), "un estado de orden", descripcion, ct);

        estado.Descripcion = descripcion;
        estado.EsFinal = dto.EsFinal;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> EliminarEstadoOrdenAsync(int id, CancellationToken ct = default)
    {
        var estado = await db.EstadosOrden.FirstOrDefaultAsync(e => e.IdEstadoOrden == id, ct);
        if (estado is null)
        {
            return null;
        }

        var usos = await db.OrdenesTrabajo.CountAsync(o => o.IdEstadoOrden == id, ct);
        if (usos > 0)
        {
            throw new ConflictException($"No se puede borrar: hay {usos} orden(es) en este estado.");
        }

        db.TiposTrabajoEstadoOrden.RemoveRange(await db.TiposTrabajoEstadoOrden.Where(v => v.IdEstadoOrden == id).ToListAsync(ct));
        db.EstadosOrden.Remove(estado);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    // ------------------------------------------------------------ Prioridades (globales)

    public async Task<SistemasDto> CrearPrioridadAsync(DescripcionDto dto, CancellationToken ct = default)
    {
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.Prioridades.Where(p => p.Descripcion == descripcion), "una prioridad", descripcion, ct);

        db.Prioridades.Add(new Prioridad { Descripcion = descripcion });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> RenombrarPrioridadAsync(int id, DescripcionDto dto, CancellationToken ct = default)
    {
        var prioridad = await db.Prioridades.FirstOrDefaultAsync(p => p.IdPrioridad == id, ct);
        if (prioridad is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.Prioridades.Where(p => p.Descripcion == descripcion && p.IdPrioridad != id), "una prioridad", descripcion, ct);

        prioridad.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> EliminarPrioridadAsync(int id, CancellationToken ct = default)
    {
        var prioridad = await db.Prioridades.FirstOrDefaultAsync(p => p.IdPrioridad == id, ct);
        if (prioridad is null)
        {
            return null;
        }

        var usos = await db.OrdenesTrabajo.CountAsync(o => o.IdPrioridad == id, ct);
        if (usos > 0)
        {
            throw new ConflictException($"No se puede borrar: hay {usos} orden(es) con esta prioridad.");
        }

        db.Prioridades.Remove(prioridad);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    // ------------------------------------------------------------ Estados de activo generales (sin categoría)

    public async Task<SistemasDto> CrearEstadoGeneralAsync(DescripcionDto dto, CancellationToken ct = default)
    {
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.EstadosActivo.Where(e => e.IdCategoriaActivo == null && e.Descripcion == descripcion), "un estado general", descripcion, ct);

        db.EstadosActivo.Add(new EstadoActivo { IdCategoriaActivo = null, Descripcion = descripcion });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> RenombrarEstadoGeneralAsync(int id, DescripcionDto dto, CancellationToken ct = default)
    {
        var estado = await db.EstadosActivo.FirstOrDefaultAsync(e => e.IdEstadoActivo == id && e.IdCategoriaActivo == null, ct);
        if (estado is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(
            db.EstadosActivo.Where(e => e.IdCategoriaActivo == null && e.Descripcion == descripcion && e.IdEstadoActivo != id),
            "un estado general", descripcion, ct);

        estado.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<SistemasDto?> EliminarEstadoGeneralAsync(int id, CancellationToken ct = default)
    {
        var estado = await db.EstadosActivo.FirstOrDefaultAsync(e => e.IdEstadoActivo == id && e.IdCategoriaActivo == null, ct);
        if (estado is null)
        {
            return null;
        }

        var usos = await db.Activos.CountAsync(a => a.IdEstadoActivo == id, ct);
        if (usos > 0)
        {
            throw new ConflictException($"No se puede borrar: {usos} activo(s) tienen este estado.");
        }

        db.EstadosActivo.Remove(estado);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }
}
