using Microsoft.EntityFrameworkCore;
using TallerApp.Data;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Repositories;

// REPOSITORIO de Trabajos (y del catálogo de tipos de trabajo, que se usa junto con ellos).
// Un trabajo es del taller de su vehículo: por eso se filtra con trabajo.Vehiculo.TallerId.
public class TrabajoRepository(TallerDbContext contexto) : ITrabajoRepository
{
    public Trabajo? ObtenerConDetalle(int tallerId, int id) => contexto.Trabajos
        .Include(t => t.TipoTrabajo).Include(t => t.Mecanico)
        .FirstOrDefault(t => t.Id == id && t.Vehiculo!.TallerId == tallerId);

    public List<Trabajo> ListarConDetalle(int tallerId) => contexto.Trabajos.AsNoTracking()
        .Where(t => t.Vehiculo!.TallerId == tallerId)
        .Include(t => t.Vehiculo).Include(t => t.TipoTrabajo).Include(t => t.Mecanico)
        .ToList();

    public bool MecanicoTieneTrabajos(int mecanicoId) => contexto.Trabajos.Any(t => t.MecanicoId == mecanicoId);

    public List<TipoTrabajo> ListarTipos() => contexto.TiposTrabajo.OrderBy(t => t.Nombre).ToList();

    public bool ExisteTipo(int id) => contexto.TiposTrabajo.Any(t => t.Id == id);

    public void Agregar(Trabajo trabajo) => contexto.Trabajos.Add(trabajo);

    public void Guardar() => contexto.SaveChanges();
}
