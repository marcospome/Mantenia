using TallerApp.DTOs;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Services;

public class VehiculoService(IVehiculoRepository repositorio) : IVehiculoService
{
    public List<VehiculoDto> Listar(int tallerId, string? patente, string? propietario) =>
        repositorio.Listar(tallerId, patente, propietario).Select(VehiculoDto.Desde).ToList();

    public VehiculoDetalleDto? Obtener(int tallerId, int id)
    {
        var vehiculo = repositorio.ObtenerConTrabajos(tallerId, id);
        return vehiculo is null ? null : VehiculoDetalleDto.DesdeConTrabajos(vehiculo);
    }

    public Resultado<VehiculoDto> Crear(int tallerId, VehiculoDto dto)
    {
        var vehiculo = new Vehiculo { TallerId = tallerId };      // regla: el taller lo pone el servidor, no el cliente
        dto.CopiarEn(vehiculo);

        if (repositorio.ExistePatente(tallerId, vehiculo.Patente, 0))      // regla: la patente no se repite dentro del taller
            return Resultado<VehiculoDto>.Conflicto("Ya existe un vehículo con esa patente");

        repositorio.Agregar(vehiculo);
        repositorio.Guardar();
        return Resultado<VehiculoDto>.Correcto(VehiculoDto.Desde(vehiculo));
    }

    public Resultado<VehiculoDto> Modificar(int tallerId, int id, VehiculoDto dto)
    {
        var vehiculo = repositorio.Obtener(tallerId, id);
        if (vehiculo is null) return Resultado<VehiculoDto>.NoEncontrado("El vehículo no existe");

        dto.CopiarEn(vehiculo);
        if (repositorio.ExistePatente(tallerId, vehiculo.Patente, id))
            return Resultado<VehiculoDto>.Conflicto("Ya existe un vehículo con esa patente");

        repositorio.Guardar();
        return Resultado<VehiculoDto>.Correcto(VehiculoDto.Desde(vehiculo));
    }

    public Resultado<bool> Eliminar(int tallerId, int id)
    {
        var vehiculo = repositorio.Obtener(tallerId, id);
        if (vehiculo is null) return Resultado<bool>.NoEncontrado("El vehículo no existe");

        repositorio.Eliminar(vehiculo);
        repositorio.Guardar();
        return Resultado<bool>.Correcto(true);
    }
}
