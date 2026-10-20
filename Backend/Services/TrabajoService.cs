using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Services;

// Reglas de los Trabajos: el alta asociada a un vehículo y el cambio de estado.
public class TrabajoService(ITrabajoRepository trabajos, IVehiculoRepository vehiculos, IMecanicoRepository mecanicos) : ITrabajoService
{
    public List<TipoTrabajoDto> ListarTipos() =>
        trabajos.ListarTipos().Select(t => new TipoTrabajoDto(t.Id, t.Nombre)).ToList();

    public Resultado<TrabajoDto> Agregar(int tallerId, int vehiculoId, NuevoTrabajoDto dto)
    {
        // regla: el vehículo y el mecánico tienen que ser DE ESTE taller
        if (vehiculos.Obtener(tallerId, vehiculoId) is null) return Resultado<TrabajoDto>.NoEncontrado("El vehículo no existe");
        if (mecanicos.Obtener(tallerId, dto.MecanicoId!.Value) is null) return Resultado<TrabajoDto>.NoEncontrado("El mecánico no existe");
        if (!trabajos.ExisteTipo(dto.TipoTrabajoId!.Value)) return Resultado<TrabajoDto>.NoEncontrado("El tipo de trabajo no existe");

        var trabajo = new Trabajo
        {
            VehiculoId = vehiculoId,
            TipoTrabajoId = dto.TipoTrabajoId.Value,
            MecanicoId = dto.MecanicoId.Value,
            Fecha = dto.Fecha!.Value,
            Descripcion = dto.Descripcion!,
            Costo = dto.Costo!.Value,
            // el Estado arranca en "Pendiente" (valor por defecto del model)
        };
        trabajos.Agregar(trabajo);
        trabajos.Guardar();
        return Resultado<TrabajoDto>.Correcto(TrabajoDto.Desde(trabajos.ObtenerConDetalle(tallerId, trabajo.Id)!));
    }

    // Regla: el estado solo avanza de a un paso (Pendiente -> En curso -> Finalizado).
    public Resultado<TrabajoDto> Avanzar(int tallerId, int id)
    {
        var trabajo = trabajos.ObtenerConDetalle(tallerId, id);
        if (trabajo is null) return Resultado<TrabajoDto>.NoEncontrado("El trabajo no existe");

        var posicion = Array.IndexOf(EstadosTrabajo.Orden, trabajo.Estado);
        if (posicion >= EstadosTrabajo.Orden.Length - 1) return Resultado<TrabajoDto>.Conflicto("El trabajo ya está finalizado");

        trabajo.Estado = EstadosTrabajo.Orden[posicion + 1];
        trabajos.Guardar();
        return Resultado<TrabajoDto>.Correcto(TrabajoDto.Desde(trabajo));
    }
}
