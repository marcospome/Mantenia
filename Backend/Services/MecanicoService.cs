using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Services;

// Reglas de los Mecánicos. Cada taller maneja los suyos.
public class MecanicoService(IMecanicoRepository mecanicos, ITrabajoRepository trabajos) : IMecanicoService
{
    public List<MecanicoDto> Listar(int tallerId) => mecanicos.Listar(tallerId).Select(MecanicoDto.Desde).ToList();

    public MecanicoDto Agregar(int tallerId, MecanicoDto dto)
    {
        var mecanico = new Mecanico
        {
            Nombre = dto.Nombre!, Especialidad = dto.Especialidad!, Telefono = dto.Telefono!,
            TallerId = tallerId,                   
        };
        mecanicos.Agregar(mecanico);
        mecanicos.Guardar();
        return MecanicoDto.Desde(mecanico);
    }

    public Resultado<bool> Eliminar(int tallerId, int id)
    {
        var mecanico = mecanicos.Obtener(tallerId, id);
        if (mecanico is null) return Resultado<bool>.NoEncontrado("El mecánico no existe");

        // Regla: no se puede borrar un mecánico que tiene trabajos asignados
        if (trabajos.MecanicoTieneTrabajos(id)) return Resultado<bool>.Conflicto("No se puede eliminar: tiene trabajos asignados");

        mecanicos.Eliminar(mecanico);
        mecanicos.Guardar();
        return Resultado<bool>.Correcto(true);
    }
}
