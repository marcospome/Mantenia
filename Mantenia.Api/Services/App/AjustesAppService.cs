using Mantenia.Api.Common;
using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

/// <summary>
/// Catálogos propios de la organización del usuario: categorías de activo y, dentro de cada una,
/// sus estados y tipos de trabajo (con los estados de orden que usa cada tipo).
/// Todo se filtra por la organización del token: no se puede tocar lo de otra organización.
/// </summary>
public sealed class AjustesAppService(ManteniaDbContext db, ICurrentUser usuarioActual) : IAjustesAppService
{
    private int Org => usuarioActual.IdOrganizacion
        ?? throw new ConflictException("Tu usuario no pertenece a ninguna organización.");

    public async Task<AjustesOrganizacionDto> GetAsync(CancellationToken ct = default)
    {
        var org = Org;

        var nombreOrg = await db.Organizaciones.AsNoTracking()
            .Where(o => o.IdOrganizacion == org)
            .Select(o => o.RazonSocial)
            .FirstOrDefaultAsync(ct);

        var categorias = await db.CategoriasActivo.AsNoTracking()
            .Where(c => c.IdOrganizacion == org)
            .OrderBy(c => c.Descripcion)
            .Select(c => new
            {
                c.IdCategoriaActivo,
                c.Descripcion,
                Activos = db.Activos.Count(a => a.IdCategoriaActivo == c.IdCategoriaActivo),
            })
            .ToListAsync(ct);
        var ids = categorias.Select(c => (int?)c.IdCategoriaActivo).ToList();

        var estados = await db.EstadosActivo.AsNoTracking()
            .Where(e => ids.Contains(e.IdCategoriaActivo))
            .OrderBy(e => e.Descripcion)
            .Select(e => new
            {
                e.IdCategoriaActivo,
                Item = new ItemAjusteDto(e.IdEstadoActivo, e.Descripcion ?? "", db.Activos.Count(a => a.IdEstadoActivo == e.IdEstadoActivo)),
            })
            .ToListAsync(ct);

        var tipos = await db.TiposTrabajo.AsNoTracking()
            .Where(t => ids.Contains(t.IdCategoriaActivo))
            .OrderBy(t => t.Descripcion)
            .Select(t => new
            {
                t.IdTipoTrabajo,
                t.IdCategoriaActivo,
                t.Descripcion,
                Usos = db.OrdenesTrabajo.Count(o => o.IdTipoTrabajo == t.IdTipoTrabajo),
            })
            .ToListAsync(ct);
        var idsTipos = tipos.Select(t => (int?)t.IdTipoTrabajo).ToList();

        var vinculos = await db.TiposTrabajoEstadoOrden.AsNoTracking()
            .Where(v => idsTipos.Contains(v.IdTipoTrabajo) && v.IdEstadoOrden != null)
            .Select(v => new { v.IdTipoTrabajo, IdEstadoOrden = v.IdEstadoOrden!.Value })
            .ToListAsync(ct);

        var generales = await db.EstadosActivo.AsNoTracking()
            .Where(e => e.IdCategoriaActivo == null)
            .OrderBy(e => e.Descripcion)
            .Select(e => new ItemDto(e.IdEstadoActivo, e.Descripcion ?? "", null, null))
            .ToListAsync(ct);

        var estadosOrden = await db.EstadosOrden.AsNoTracking()
            .OrderBy(e => e.IdEstadoOrden)
            .Select(e => new ItemDto(e.IdEstadoOrden, e.Descripcion ?? "", null, e.EsFinal == true ? "final" : null))
            .ToListAsync(ct);

        return new AjustesOrganizacionDto(
            nombreOrg,
            categorias.Select(c => new CategoriaAjusteDto(
                c.IdCategoriaActivo,
                c.Descripcion ?? "",
                c.Activos,
                estados.Where(e => e.IdCategoriaActivo == c.IdCategoriaActivo).Select(e => e.Item).ToList(),
                tipos.Where(t => t.IdCategoriaActivo == c.IdCategoriaActivo)
                    .Select(t => new TipoTrabajoAjusteDto(
                        t.IdTipoTrabajo,
                        t.Descripcion ?? "",
                        t.Usos,
                        vinculos.Where(v => v.IdTipoTrabajo == t.IdTipoTrabajo).Select(v => v.IdEstadoOrden).Order().ToList()))
                    .ToList()))
                .ToList(),
            generales,
            estadosOrden);
    }

    // ------------------------------------------------------------ Categorías

    public async Task<AjustesOrganizacionDto> CrearCategoriaAsync(DescripcionDto dto, CancellationToken ct = default)
    {
        var org = Org;
        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.CategoriasActivo.Where(c => c.IdOrganizacion == org && c.Descripcion == descripcion), "una categoría", descripcion, ct);

        db.CategoriasActivo.Add(new CategoriaActivo { IdOrganizacion = org, Descripcion = descripcion });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<AjustesOrganizacionDto?> RenombrarCategoriaAsync(int id, DescripcionDto dto, CancellationToken ct = default)
    {
        var org = Org;
        var categoria = await db.CategoriasActivo.FirstOrDefaultAsync(c => c.IdCategoriaActivo == id && c.IdOrganizacion == org, ct);
        if (categoria is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(
            db.CategoriasActivo.Where(c => c.IdOrganizacion == org && c.Descripcion == descripcion && c.IdCategoriaActivo != id),
            "una categoría", descripcion, ct);

        categoria.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    /// <summary>Borra la categoría junto con sus estados y tipos de trabajo, si nada los usa.</summary>
    public async Task<AjustesOrganizacionDto?> EliminarCategoriaAsync(int id, CancellationToken ct = default)
    {
        var org = Org;
        var categoria = await db.CategoriasActivo.FirstOrDefaultAsync(c => c.IdCategoriaActivo == id && c.IdOrganizacion == org, ct);
        if (categoria is null)
        {
            return null;
        }

        var activos = await db.Activos.CountAsync(a => a.IdCategoriaActivo == id, ct);
        if (activos > 0)
        {
            throw new ConflictException($"No se puede borrar: hay {activos} activo(s) en esta categoría. Cambiales la categoría primero.");
        }

        var tipos = await db.TiposTrabajo.Where(t => t.IdCategoriaActivo == id).ToListAsync(ct);
        var idsTipos = tipos.Select(t => (int?)t.IdTipoTrabajo).ToList();
        if (await db.OrdenesTrabajo.AnyAsync(o => idsTipos.Contains(o.IdTipoTrabajo), ct))
        {
            throw new ConflictException("No se puede borrar: hay órdenes de trabajo con tipos de trabajo de esta categoría.");
        }

        var estados = await db.EstadosActivo.Where(e => e.IdCategoriaActivo == id).ToListAsync(ct);
        var idsEstados = estados.Select(e => (int?)e.IdEstadoActivo).ToList();
        if (await db.Activos.AnyAsync(a => idsEstados.Contains(a.IdEstadoActivo), ct))
        {
            throw new ConflictException("No se puede borrar: hay activos que usan estados de esta categoría.");
        }

        db.TiposTrabajoEstadoOrden.RemoveRange(await db.TiposTrabajoEstadoOrden.Where(v => idsTipos.Contains(v.IdTipoTrabajo)).ToListAsync(ct));
        db.TiposTrabajo.RemoveRange(tipos);
        db.EstadosActivo.RemoveRange(estados);
        db.CategoriasActivo.Remove(categoria);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    // ------------------------------------------------------------ Estados de activo

    public async Task<AjustesOrganizacionDto?> CrearEstadoAsync(int idCategoria, DescripcionDto dto, CancellationToken ct = default)
    {
        if (!await EsCategoriaPropiaAsync(idCategoria, ct))
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.EstadosActivo.Where(e => e.IdCategoriaActivo == idCategoria && e.Descripcion == descripcion), "un estado", descripcion, ct);

        db.EstadosActivo.Add(new EstadoActivo { IdCategoriaActivo = idCategoria, Descripcion = descripcion });
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<AjustesOrganizacionDto?> RenombrarEstadoAsync(int id, DescripcionDto dto, CancellationToken ct = default)
    {
        var estado = await EstadoPropioAsync(id, ct);
        if (estado is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(
            db.EstadosActivo.Where(e => e.IdCategoriaActivo == estado.IdCategoriaActivo && e.Descripcion == descripcion && e.IdEstadoActivo != id),
            "un estado", descripcion, ct);

        estado.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<AjustesOrganizacionDto?> EliminarEstadoAsync(int id, CancellationToken ct = default)
    {
        var estado = await EstadoPropioAsync(id, ct);
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

    // ------------------------------------------------------------ Tipos de trabajo

    public async Task<AjustesOrganizacionDto?> CrearTipoTrabajoAsync(int idCategoria, TipoTrabajoGuardarDto dto, CancellationToken ct = default)
    {
        if (!await EsCategoriaPropiaAsync(idCategoria, ct))
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(db.TiposTrabajo.Where(t => t.IdCategoriaActivo == idCategoria && t.Descripcion == descripcion), "un tipo de trabajo", descripcion, ct);

        var tipo = new TipoTrabajo { IdCategoriaActivo = idCategoria, Descripcion = descripcion };
        db.TiposTrabajo.Add(tipo);
        await db.SaveChangesAsync(ct);

        await GuardarEstadosDelTipoAsync(tipo.IdTipoTrabajo, dto.IdsEstadoOrden, ct);
        return await GetAsync(ct);
    }

    public async Task<AjustesOrganizacionDto?> GuardarTipoTrabajoAsync(int id, TipoTrabajoGuardarDto dto, CancellationToken ct = default)
    {
        var org = Org;
        var tipo = await db.TiposTrabajo.FirstOrDefaultAsync(t => t.IdTipoTrabajo == id && t.CategoriaActivo!.IdOrganizacion == org, ct);
        if (tipo is null)
        {
            return null;
        }

        var descripcion = Limpiar(dto.Descripcion);
        await ExigirUnicoAsync(
            db.TiposTrabajo.Where(t => t.IdCategoriaActivo == tipo.IdCategoriaActivo && t.Descripcion == descripcion && t.IdTipoTrabajo != id),
            "un tipo de trabajo", descripcion, ct);

        tipo.Descripcion = descripcion;
        await db.SaveChangesAsync(ct);

        await GuardarEstadosDelTipoAsync(id, dto.IdsEstadoOrden, ct);
        return await GetAsync(ct);
    }

    public async Task<AjustesOrganizacionDto?> EliminarTipoTrabajoAsync(int id, CancellationToken ct = default)
    {
        var org = Org;
        var tipo = await db.TiposTrabajo.FirstOrDefaultAsync(t => t.IdTipoTrabajo == id && t.CategoriaActivo!.IdOrganizacion == org, ct);
        if (tipo is null)
        {
            return null;
        }

        var usos = await db.OrdenesTrabajo.CountAsync(o => o.IdTipoTrabajo == id, ct);
        if (usos > 0)
        {
            throw new ConflictException($"No se puede borrar: hay {usos} orden(es) de trabajo de este tipo.");
        }

        db.TiposTrabajoEstadoOrden.RemoveRange(await db.TiposTrabajoEstadoOrden.Where(v => v.IdTipoTrabajo == id).ToListAsync(ct));
        db.TiposTrabajo.Remove(tipo);
        await db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    /// <summary>
    /// Estados de orden por los que pasa el tipo de trabajo (TipoTrabajoEstadoOrden).
    /// null = no tocar; lista vacía = sin restricción (se usan todos los estados).
    /// </summary>
    private async Task GuardarEstadosDelTipoAsync(int idTipo, IReadOnlyList<int>? idsEstadoOrden, CancellationToken ct)
    {
        if (idsEstadoOrden is null)
        {
            return;
        }

        var deseados = idsEstadoOrden.Distinct().ToHashSet();
        var validos = await db.EstadosOrden.Where(e => deseados.Contains(e.IdEstadoOrden)).Select(e => e.IdEstadoOrden).ToListAsync(ct);
        if (validos.Count != deseados.Count)
        {
            throw new ConflictException("Alguno de los estados de orden indicados no existe.");
        }

        var actuales = await db.TiposTrabajoEstadoOrden.Where(v => v.IdTipoTrabajo == idTipo).ToListAsync(ct);
        db.TiposTrabajoEstadoOrden.RemoveRange(actuales.Where(v => v.IdEstadoOrden is not int e || !deseados.Contains(e)));
        foreach (var idEstado in deseados.Where(e => actuales.All(v => v.IdEstadoOrden != e)))
        {
            db.TiposTrabajoEstadoOrden.Add(new TipoTrabajoEstadoOrden { IdTipoTrabajo = idTipo, IdEstadoOrden = idEstado });
        }

        await db.SaveChangesAsync(ct);
    }

    // ------------------------------------------------------------ Helpers

    private Task<bool> EsCategoriaPropiaAsync(int idCategoria, CancellationToken ct)
    {
        var org = Org;
        return db.CategoriasActivo.AnyAsync(c => c.IdCategoriaActivo == idCategoria && c.IdOrganizacion == org, ct);
    }

    private Task<EstadoActivo?> EstadoPropioAsync(int id, CancellationToken ct)
    {
        var org = Org;
        return db.EstadosActivo.FirstOrDefaultAsync(e => e.IdEstadoActivo == id && e.CategoriaActivo!.IdOrganizacion == org, ct);
    }

    internal static string Limpiar(string texto)
    {
        var limpio = string.Join(' ', texto.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return limpio.Length == 0 ? throw new ConflictException("La descripción no puede estar vacía.") : limpio;
    }

    internal static async Task ExigirUnicoAsync<T>(IQueryable<T> existentes, string queCosa, string descripcion, CancellationToken ct)
    {
        if (await existentes.AnyAsync(ct))
        {
            throw new ConflictException($"Ya existe {queCosa} con el nombre “{descripcion}”.");
        }
    }
}
