using Mantenia.Api.Common;
using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

public sealed class OrdenesAppService(
    ManteniaDbContext db,
    DatosOrganizacion datos,
    ICurrentUser usuarioActual) : IOrdenesAppService
{
    public async Task<IReadOnlyList<OrdenResumenDto>> ListarAsync(string? estado, int? idActivo, CancellationToken ct = default)
    {
        var snapshot = await datos.CargarAsync(ct);
        IEnumerable<OrdenTrabajo> ordenes = snapshot.Ordenes;

        if (idActivo is int id)
        {
            ordenes = ordenes.Where(o => o.IdActivo == id);
        }

        ordenes = estado?.ToLowerInvariant() switch
        {
            "abiertas" => ordenes.Where(Indicadores.EsAbierta),
            "cerradas" => ordenes.Where(o => !Indicadores.EsAbierta(o)),
            _ => ordenes,
        };

        return ordenes
            .OrderByDescending(o => Indicadores.EsAbierta(o))
            .ThenByDescending(o => o.FechaCreacion)
            .Select(snapshot.Orden)
            .ToList();
    }

    public async Task<OrdenDetalleDto?> GetDetalleAsync(int idOrden, CancellationToken ct = default)
    {
        var snapshot = await datos.CargarAsync(ct);
        var orden = snapshot.Ordenes.FirstOrDefault(o => o.IdOrdenTrabajo == idOrden);
        if (orden is null)
        {
            return null;
        }

        var repuestos = await db.OrdenesTrabajoDetalle.AsNoTracking()
            .Where(d => d.IdOrdenTrabajo == idOrden)
            .OrderBy(d => d.IdOrdenTrabajoDetalle)
            .Select(d => new RepuestoDto(d.IdOrdenTrabajoDetalle, d.Repuesto, d.Cantidad, d.Costo))
            .ToListAsync(ct);

        var costoRepuestos = repuestos.Sum(r => (r.Cantidad ?? 1) * (r.Costo ?? 0));
        var estados = await EstadosParaTipoAsync(orden.IdTipoTrabajo, ct);

        return new OrdenDetalleDto(
            snapshot.Orden(orden),
            orden.Diagnostico,
            orden.Importe,
            costoRepuestos,
            repuestos,
            estados.Select(e => new ItemDto(e.IdEstadoOrden, e.Descripcion ?? "", null, e.EsFinal == true ? "final" : null)).ToList());
    }

    public async Task<OrdenDetalleDto?> CrearAsync(NuevaOrdenDto dto, CancellationToken ct = default)
    {
        var idActivo = dto.IdActivo!.Value;
        if (!await datos.ActivosQuery().AnyAsync(a => a.IdActivo == idActivo, ct))
        {
            return null;
        }

        var estadoInicial = (await EstadosParaTipoAsync(dto.IdTipoTrabajo, ct)).FirstOrDefault(e => e.EsFinal != true);
        var ahora = DateTime.Now;

        var orden = new OrdenTrabajo
        {
            IdActivo = idActivo,
            IdTipoTrabajo = dto.IdTipoTrabajo,
            IdPrioridad = dto.IdPrioridad,
            IdEstadoOrden = estadoInicial?.IdEstadoOrden,
            IdUsuario = usuarioActual.IdUsuario,
            FechaCreacion = ahora,
            FechaProgramada = dto.FechaProgramada,
            Descripcion = Indicadores.UnirKm(dto.Kilometraje, dto.Descripcion),
            Diagnostico = string.IsNullOrWhiteSpace(dto.Diagnostico) ? null : dto.Diagnostico.Trim(),
            Importe = dto.Importe,
        };
        db.OrdenesTrabajo.Add(orden);

        foreach (var repuesto in dto.Repuestos.Where(r => !string.IsNullOrWhiteSpace(r.Repuesto)))
        {
            db.OrdenesTrabajoDetalle.Add(new OrdenTrabajoDetalle
            {
                OrdenTrabajo = orden,
                Repuesto = repuesto.Repuesto.Trim(),
                Cantidad = repuesto.Cantidad,
                Costo = repuesto.Costo,
                FechaCreacion = ahora,
            });
        }

        await db.SaveChangesAsync(ct);
        return await GetDetalleAsync(orden.IdOrdenTrabajo, ct);
    }

    public async Task<OrdenDetalleDto?> CambiarEstadoAsync(int idOrden, CambioEstadoDto dto, CancellationToken ct = default)
    {
        var orden = await db.OrdenesTrabajo.FirstOrDefaultAsync(o => o.IdOrdenTrabajo == idOrden, ct);
        if (orden is null || !await datos.ActivosQuery().AnyAsync(a => a.IdActivo == orden.IdActivo, ct))
        {
            return null;
        }

        var estado = await db.EstadosOrden.AsNoTracking()
            .FirstOrDefaultAsync(e => e.IdEstadoOrden == dto.IdEstadoOrden, ct)
            ?? throw new ConflictException("El estado indicado no existe.");

        var estados = await EstadosParaTipoAsync(orden.IdTipoTrabajo, ct);
        var inicial = estados.FirstOrDefault(e => e.EsFinal != true)?.IdEstadoOrden;
        var ahora = DateTime.Now;

        orden.IdEstadoOrden = estado.IdEstadoOrden;
        if (estado.EsFinal == true)
        {
            orden.FechaInicio ??= orden.FechaCreacion ?? ahora;
            orden.FechaCierre = ahora;
        }
        else
        {
            orden.FechaCierre = null;
            if (estado.IdEstadoOrden != inicial)
            {
                orden.FechaInicio ??= ahora;
            }
        }

        if (dto.Importe is not null)
        {
            orden.Importe = dto.Importe;
        }
        if (!string.IsNullOrWhiteSpace(dto.Diagnostico))
        {
            orden.Diagnostico = dto.Diagnostico.Trim();
        }

        await db.SaveChangesAsync(ct);
        return await GetDetalleAsync(idOrden, ct);
    }

    // ------------------------------------------------------------ Repuestos (detalle de la orden)

    public async Task<OrdenDetalleDto?> AgregarRepuestoAsync(int idOrden, RepuestoInputDto dto, CancellationToken ct = default)
    {
        if (!await EsOrdenPropiaAsync(idOrden, ct))
        {
            return null;
        }

        db.OrdenesTrabajoDetalle.Add(new OrdenTrabajoDetalle
        {
            IdOrdenTrabajo = idOrden,
            Repuesto = dto.Repuesto.Trim(),
            Cantidad = dto.Cantidad,
            Costo = dto.Costo,
            FechaCreacion = DateTime.Now,
        });
        await db.SaveChangesAsync(ct);
        return await GetDetalleAsync(idOrden, ct);
    }

    public async Task<OrdenDetalleDto?> GuardarRepuestoAsync(int idDetalle, RepuestoInputDto dto, CancellationToken ct = default)
    {
        var detalle = await db.OrdenesTrabajoDetalle.FirstOrDefaultAsync(d => d.IdOrdenTrabajoDetalle == idDetalle, ct);
        if (detalle?.IdOrdenTrabajo is not int idOrden || !await EsOrdenPropiaAsync(idOrden, ct))
        {
            return null;
        }

        detalle.Repuesto = dto.Repuesto.Trim();
        detalle.Cantidad = dto.Cantidad;
        detalle.Costo = dto.Costo;
        await db.SaveChangesAsync(ct);
        return await GetDetalleAsync(idOrden, ct);
    }

    public async Task<OrdenDetalleDto?> EliminarRepuestoAsync(int idDetalle, CancellationToken ct = default)
    {
        var detalle = await db.OrdenesTrabajoDetalle.FirstOrDefaultAsync(d => d.IdOrdenTrabajoDetalle == idDetalle, ct);
        if (detalle?.IdOrdenTrabajo is not int idOrden || !await EsOrdenPropiaAsync(idOrden, ct))
        {
            return null;
        }

        db.OrdenesTrabajoDetalle.Remove(detalle);
        await db.SaveChangesAsync(ct);
        return await GetDetalleAsync(idOrden, ct);
    }

    /// <summary>La orden existe y su activo es de la organización del usuario.</summary>
    private Task<bool> EsOrdenPropiaAsync(int idOrden, CancellationToken ct)
    {
        var activos = datos.ActivosQuery().Select(a => (int?)a.IdActivo);
        return db.OrdenesTrabajo.AnyAsync(o => o.IdOrdenTrabajo == idOrden && activos.Contains(o.IdActivo), ct);
    }

    /// <summary>Estados configurados para el tipo de trabajo (TipoTrabajoEstadoOrden) o, si no hay, todos.</summary>
    private async Task<List<EstadoOrden>> EstadosParaTipoAsync(int? idTipoTrabajo, CancellationToken ct)
    {
        if (idTipoTrabajo is int idTipo)
        {
            var delTipo = await db.EstadosOrden.AsNoTracking()
                .Where(e => db.TiposTrabajoEstadoOrden.Any(t => t.IdTipoTrabajo == idTipo && t.IdEstadoOrden == e.IdEstadoOrden))
                .OrderBy(e => e.IdEstadoOrden)
                .ToListAsync(ct);

            if (delTipo.Count > 0)
            {
                return delTipo;
            }
        }

        return await db.EstadosOrden.AsNoTracking().OrderBy(e => e.IdEstadoOrden).ToListAsync(ct);
    }
}
