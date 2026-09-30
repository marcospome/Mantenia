using Mantenia.Api.Data;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;
using Mantenia.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Services.App;

public sealed class DashboardAppService(ManteniaDbContext db, DatosOrganizacion datos) : IDashboardAppService
{
    private static readonly string[] Meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    public async Task<DashboardDto> GetAsync(CancellationToken ct = default)
    {
        var s = await datos.CargarAsync(ct);
        var hoy = s.Ahora.Date;

        var total = s.Activos.Count;
        var detenidos = s.Salud.Values.Count(x => x.Detenido);
        var abiertas = s.Ordenes.Where(Indicadores.EsAbierta).ToList();

        var resumen = new ResumenDto(
            total,
            abiertas.Count,
            total == 0 ? 100 : Math.Round(100.0 * (total - detenidos) / total, 0),
            detenidos,
            abiertas.Count(o => o.FechaProgramada?.Date == hoy),
            s.Salud.Values.Count(x => x.KmExcedido > 0));

        var alerta = s.Activos
            .Select(a => (Activo: a, Salud: s.Salud[a.IdActivo]))
            .Where(x => x.Salud.Nivel != "ok")
            .OrderByDescending(x => x.Salud.KmExcedido > 0)
            .ThenByDescending(x => x.Salud.Probabilidad)
            .Select(x => new AlertaDto(
                x.Activo.IdActivo,
                Snapshot.NombreActivo(x.Activo),
                x.Activo.Identificador,
                MensajeAlerta(x.Salud),
                x.Salud.KmExcedido > 0 ? 99 : x.Salud.Probabilidad,
                Snapshot.NombreCompleto(x.Activo.Cliente?.Nombre, x.Activo.Cliente?.Apellido),
                x.Activo.Cliente?.Telefono))
            .FirstOrDefault();

        var proximas = abiertas
            .Where(o => o.FechaInicio is null)
            .OrderBy(o => o.FechaProgramada ?? o.FechaCreacion)
            .Take(5)
            .Select(s.Orden)
            .ToList();

        var enCurso = abiertas
            .Where(o => o.FechaInicio is not null)
            .OrderByDescending(o => o.FechaInicio)
            .Take(5)
            .Select(s.Orden)
            .ToList();

        return new DashboardDto(resumen, alerta, proximas, enCurso);
    }

    public async Task<ReporteDto> GetReporteAsync(int meses, CancellationToken ct = default)
    {
        meses = Math.Clamp(meses, 1, 24);
        var s = await datos.CargarAsync(ct);
        var desde = new DateTime(s.Ahora.Year, s.Ahora.Month, 1).AddMonths(-(meses - 1));

        // Costo de repuestos por orden
        var idsVisibles = datos.ActivosQuery().Select(a => (int?)a.IdActivo);
        var repuestosPorOrden = await db.OrdenesTrabajoDetalle.AsNoTracking()
            .Where(d => d.IdOrdenTrabajo != null && d.OrdenTrabajo != null && idsVisibles.Contains(d.OrdenTrabajo.IdActivo))
            .GroupBy(d => d.IdOrdenTrabajo!.Value)
            .Select(g => new { IdOrden = g.Key, Total = g.Sum(d => (d.Cantidad ?? 1) * (d.Costo ?? 0m)) })
            .ToDictionaryAsync(x => x.IdOrden, x => x.Total, ct);

        decimal CostoOrden(OrdenTrabajo o)
            => (o.Importe ?? 0) + (repuestosPorOrden.TryGetValue(o.IdOrdenTrabajo, out var r) ? r : 0);

        var serie = new List<PuntoMensualDto>();
        for (var i = 0; i < meses; i++)
        {
            var inicio = desde.AddMonths(i);
            var fin = inicio.AddMonths(1);
            var cerradas = s.Ordenes.Where(o => o.FechaCierre >= inicio && o.FechaCierre < fin).ToList();
            var horas = s.Ordenes
                .Where(o => o.FechaInicio >= inicio && o.FechaInicio < fin)
                .Sum(o => Indicadores.HorasDetenido(o, s.Ahora));

            serie.Add(new PuntoMensualDto(
                inicio.ToString("yyyy-MM"),
                Meses[inicio.Month - 1],
                Math.Round(horas, 1),
                cerradas.Count,
                cerradas.Sum(CostoOrden)));
        }

        var ultimo = serie[^1];
        var anterior = serie.Count > 1 ? serie[^2] : null;

        var delPeriodo = s.Ordenes.Where(o => (o.FechaCierre ?? o.FechaCreacion) >= desde).ToList();

        var criticos = delPeriodo
            .Where(o => Indicadores.EsFalla(o) && o.IdActivo is not null && s.PorId.ContainsKey(o.IdActivo.Value))
            .GroupBy(o => o.IdActivo!.Value)
            .Select(g => new
            {
                IdActivo = g.Key,
                Fallas = g.Count(),
                Horas = g.Sum(o => Indicadores.HorasDetenido(o, s.Ahora)),
            })
            .OrderByDescending(x => x.Fallas).ThenByDescending(x => x.Horas)
            .Take(5)
            .Select(x => new ActivoCriticoDto(
                x.IdActivo,
                Snapshot.NombreActivo(s.PorId[x.IdActivo]),
                x.Fallas,
                Math.Round(x.Horas, 1),
                x.Fallas >= 3 ? "Evaluar reposición" : "Reparar"))
            .ToList();

        var ordenesPorCliente = delPeriodo
            .Where(o => o.IdActivo is int id && s.PorId.TryGetValue(id, out var a) && a.IdCliente is not null)
            .GroupBy(o => s.PorId[o.IdActivo!.Value].IdCliente!.Value)
            .Select(g => g.Count())
            .ToList();
        double? recurrentes = ordenesPorCliente.Count == 0
            ? null
            : Math.Round(100.0 * ordenesPorCliente.Count(c => c >= 2) / ordenesPorCliente.Count, 0);

        var contactar = s.Activos
            .Where(a => a.Cliente is not null && s.Salud[a.IdActivo].Nivel != "ok")
            .OrderByDescending(a => s.Salud[a.IdActivo].KmExcedido ?? int.MinValue)
            .ThenByDescending(a => s.Salud[a.IdActivo].Probabilidad)
            .Take(10)
            .Select(a => new ContactoDto(
                a.IdActivo,
                Snapshot.NombreActivo(a),
                Snapshot.NombreCompleto(a.Cliente!.Nombre, a.Cliente.Apellido),
                a.Cliente.Telefono,
                s.Salud[a.IdActivo].Sugerencia ?? "Revisión sugerida"))
            .ToList();

        return new ReporteDto(
            meses,
            serie,
            ultimo.HorasDetenido,
            Variacion(ultimo.HorasDetenido, anterior?.HorasDetenido),
            ultimo.OrdenesCerradas,
            Variacion(ultimo.OrdenesCerradas, anterior?.OrdenesCerradas),
            serie.Sum(p => p.Costo),
            serie.Sum(p => p.OrdenesCerradas),
            recurrentes,
            criticos,
            contactar);
    }

    private static double? Variacion(double actual, double? anterior)
        => anterior is double a && a > 0 ? Math.Round(100 * (actual - a) / a, 0) : null;

    private static string MensajeAlerta(SaludDto salud)
    {
        var c = Indicadores.Cultura;
        if (salud.KmExcedido is int excedido && excedido > 0)
        {
            return $"Service vencido por {excedido.ToString("N0", c)} km";
        }
        if (salud.KmExcedido is int faltan && faltan >= -Indicadores.AvisoServiceKm)
        {
            return $"Service en ~{(-faltan).ToString("N0", c)} km";
        }

        var mtbf = salud.MtbfDias is double m ? $" · MTBF {Math.Round(m).ToString(c)} d" : "";
        return salud.DiasProximaFalla is int dias && dias > 0
            ? $"Probable falla en {dias} {(dias == 1 ? "día" : "días")}{mtbf}"
            : $"Falla probable en cualquier momento{mtbf}";
    }
}
