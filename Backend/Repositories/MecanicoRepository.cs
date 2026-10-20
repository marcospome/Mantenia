using TallerApp.Data;
using TallerApp.Interfaces;
using TallerApp.Models;

namespace TallerApp.Repositories;

// REPOSITORIO de Mecánicos. Cada taller tiene los suyos.
public class MecanicoRepository(TallerDbContext contexto) : IMecanicoRepository
{
    public List<Mecanico> Listar(int tallerId) =>
        contexto.Mecanicos.Where(m => m.TallerId == tallerId).OrderBy(m => m.Nombre).ToList();

    public Mecanico? Obtener(int tallerId, int id) =>
        contexto.Mecanicos.FirstOrDefault(m => m.Id == id && m.TallerId == tallerId);

    public int Contar(int tallerId) => contexto.Mecanicos.Count(m => m.TallerId == tallerId);

    public void Agregar(Mecanico mecanico) => contexto.Mecanicos.Add(mecanico);

    public void Eliminar(Mecanico mecanico) => contexto.Mecanicos.Remove(mecanico);

    public void Guardar() => contexto.SaveChanges();
}
