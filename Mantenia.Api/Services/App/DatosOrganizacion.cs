using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

/// <summary>
/// Carga los activos y órdenes visibles para la organización del usuario logueado.
/// Todas las consultas de activos y órdenes parten de <see cref="ActivosQuery"/>: es el único filtro por organización.
/// Un usuario sin organización no ve ningún activo.
/// </summary>
public sealed class DatosOrganizacion(ManteniaDbContext db, ICurrentUser usuario)
{
    public IQueryable<Activo> ActivosQuery()
    {
        var org = usuario.IdOrganizacion;
        return db.Activos.AsNoTracking().Where(a => org != null && a.IdOrganizacion == org);
    }

    public async Task<Snapshot> CargarAsync(CancellationToken ct)
    {
        var activosQuery = ActivosQuery();

        var activos = await activosQuery
            .Include(a => a.Cliente)
            .Include(a => a.CategoriaActivo)
            .Include(a => a.EstadoActivo)
            .Include(a => a.Ubicacion).ThenInclude(u => u!.Localidad)
            .ToListAsync(ct);

        var idsVisibles = activosQuery.Select(a => (int?)a.IdActivo);
        var ordenes = await db.OrdenesTrabajo.AsNoTracking()
            .Where(o => idsVisibles.Contains(o.IdActivo))
            .Include(o => o.TipoTrabajo)
            .Include(o => o.EstadoOrden)
            .Include(o => o.Prioridad)
            .Include(o => o.Usuario)
            .ToListAsync(ct);

        return new Snapshot(activos, ordenes, DateTime.Now);
    }
}

public sealed class Snapshot
{
    public Snapshot(List<Activo> activos, List<OrdenTrabajo> ordenes, DateTime ahora)
    {
        Activos = activos;
        Ordenes = ordenes;
        Ahora = ahora;
        PorId = activos.ToDictionary(a => a.IdActivo);
        OrdenesPorActivo = ordenes.Where(o => o.IdActivo.HasValue).ToLookup(o => o.IdActivo!.Value);
        Salud = activos.ToDictionary(
            a => a.IdActivo,
            a => Indicadores.CalcularSalud(a, OrdenesPorActivo[a.IdActivo].ToList(), ahora));
    }

    public List<Activo> Activos { get; }
    public List<OrdenTrabajo> Ordenes { get; }
    public DateTime Ahora { get; }
    public Dictionary<int, Activo> PorId { get; }
    public ILookup<int, OrdenTrabajo> OrdenesPorActivo { get; }
    public Dictionary<int, SaludDto> Salud { get; }

    public ActivoResumenDto Resumen(Activo a) => new(
        a.IdActivo,
        a.Nombre,
        a.Identificador,
        a.Marca,
        a.Modelo,
        a.IdCategoriaActivo,
        a.CategoriaActivo?.Descripcion,
        a.IdCliente,
        TextoUbicacion(a.Ubicacion),
        NombreCompleto(a.Cliente?.Nombre, a.Cliente?.Apellido),
        a.Cliente?.Telefono,
        a.EstadoActivo?.Descripcion,
        Salud[a.IdActivo]);

    public OrdenResumenDto Orden(OrdenTrabajo o)
    {
        Activo? activo = o.IdActivo is int id && PorId.TryGetValue(id, out var encontrado) ? encontrado : null;
        var (km, texto) = Indicadores.SepararKm(o.Descripcion);

        return new OrdenResumenDto(
            o.IdOrdenTrabajo,
            o.IdActivo,
            NombreActivo(activo),
            activo?.Identificador,
            NombreCompleto(activo?.Cliente?.Nombre, activo?.Cliente?.Apellido),
            o.TipoTrabajo?.Descripcion,
            Indicadores.EsFalla(o),
            o.IdEstadoOrden,
            o.EstadoOrden?.Descripcion,
            Indicadores.EsAbierta(o),
            o.Prioridad?.Descripcion,
            o.FechaCreacion,
            o.FechaProgramada,
            o.FechaInicio,
            o.FechaCierre,
            texto,
            km,
            NombreCompleto(o.Usuario?.Nombre, o.Usuario?.Apellido));
    }

    public static string NombreActivo(Activo? a)
        => a?.Nombre ?? a?.Identificador ?? (a is null ? "Sin activo" : $"Activo {a.IdActivo}");

    public static string? NombreCompleto(string? nombre, string? apellido)
    {
        var texto = $"{nombre} {apellido}".Trim();
        return texto.Length == 0 ? null : texto;
    }

    private static string? TextoUbicacion(Ubicacion? u)
    {
        if (u is null)
        {
            return null;
        }

        var partes = new[] { u.Direccion, u.Localidad?.Descripcion }.Where(p => !string.IsNullOrWhiteSpace(p));
        var texto = string.Join(", ", partes);
        return texto.Length == 0 ? null : texto;
    }
}
