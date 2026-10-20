using Microsoft.EntityFrameworkCore;
using TallerApp.Data;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Repositories;

// REPOSITORIO: la clase que sabe leer y escribir Vehículos en la base. No tiene reglas de negocio.
// Todas las consultas filtran por tallerId: así cada taller solo llega a SUS vehículos.
public class VehiculoRepository(TallerDbContext contexto) : IVehiculoRepository
{
    // Listado con buscador por DOS campos: patente y propietario (si vienen vacíos, no filtran)
    public List<Vehiculo> Listar(int tallerId, string? patente, string? propietario)
    {
        var consulta = contexto.Vehiculos.Where(v => v.TallerId == tallerId);
        if (!string.IsNullOrWhiteSpace(patente)) consulta = consulta.Where(v => v.Patente.Contains(patente));
        if (!string.IsNullOrWhiteSpace(propietario)) consulta = consulta.Where(v => v.Propietario.Contains(propietario));
        return consulta.OrderBy(v => v.Patente).ToList();
    }

    // Si el vehículo es de OTRO taller devuelve null: para este taller «no existe».
    public Vehiculo? Obtener(int tallerId, int id) =>
        contexto.Vehiculos.FirstOrDefault(v => v.Id == id && v.TallerId == tallerId);

    // Con sus trabajos y, de cada trabajo, su tipo y su mecánico (AsNoTracking = solo lectura)
    public Vehiculo? ObtenerConTrabajos(int tallerId, int id) => contexto.Vehiculos.AsNoTracking()
        .Include(v => v.Trabajos).ThenInclude(t => t.TipoTrabajo)
        .Include(v => v.Trabajos).ThenInclude(t => t.Mecanico)
        .FirstOrDefault(v => v.Id == id && v.TallerId == tallerId);

    // ¿Hay OTRO vehículo con esa patente EN ESTE TALLER? (idExcluido es el propio vehículo al editar)
    public bool ExistePatente(int tallerId, string patente, int idExcluido) =>
        contexto.Vehiculos.Any(v => v.TallerId == tallerId && v.Patente == patente && v.Id != idExcluido);

    public int Contar(int tallerId) => contexto.Vehiculos.Count(v => v.TallerId == tallerId);

    public void Agregar(Vehiculo vehiculo) => contexto.Vehiculos.Add(vehiculo);

    public void Eliminar(Vehiculo vehiculo) => contexto.Vehiculos.Remove(vehiculo);   // sus trabajos se borran en cascada

    public void Guardar() => contexto.SaveChanges();
}
