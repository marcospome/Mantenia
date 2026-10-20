using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Services;

// Arma los números del panel principal DE UN TALLER. Trae sus trabajos a memoria y calcula con LINQ
public class PanelService(ITrabajoRepository trabajos, IVehiculoRepository vehiculos, IMecanicoRepository mecanicos) : IPanelService
{
    public PanelDto Obtener(int tallerId)
    {
        var lista = trabajos.ListarConDetalle(tallerId);

        return new PanelDto(
            Vehiculos: vehiculos.Contar(tallerId),
            Mecanicos: mecanicos.Contar(tallerId),
            Pendientes: lista.Count(t => t.Estado == EstadosTrabajo.Pendiente),
            EnCurso: lista.Count(t => t.Estado == EstadosTrabajo.EnCurso),
            Finalizados: lista.Count(t => t.Estado == EstadosTrabajo.Finalizado),
            Ingresos: lista.Where(t => t.Estado == EstadosTrabajo.Finalizado).Sum(t => t.Costo),
            PorTipo: lista
                .GroupBy(t => t.TipoTrabajo!.Nombre)                                // agrupa por tipo
                .Select(grupo => new ItemPanelDto(grupo.Key, grupo.Count()))        // cuenta cada grupo
                .OrderByDescending(item => item.Cantidad)
                .ToList(),
            Ultimos: lista
                .OrderByDescending(t => t.Id)
                .Take(5)                                                            // los 5 más nuevos
                .Select(t => new UltimoTrabajoDto(t.VehiculoId, t.Vehiculo!.Patente, t.TipoTrabajo!.Nombre,
                                                  t.Mecanico!.Nombre, t.Estado, t.Fecha, t.Costo))
                .ToList());
    }
}
