using TallerApp.Models;

namespace TallerApp.Interfaces;


// Reglas comunes de los repositorios:
//  - Todos reciben el tallerId: cada taller solo llega a SUS datos.
//  - Agregar y Eliminar solo "marcan" el cambio; Guardar() lo manda a la base.

public interface IVehiculoRepository
{
    List<Vehiculo> Listar(int tallerId, string? patente, string? propietario);
    Vehiculo? Obtener(int tallerId, int id);                          // para modificar o borrar
    Vehiculo? ObtenerConTrabajos(int tallerId, int id);               // solo para mostrar
    bool ExistePatente(int tallerId, string patente, int idExcluido);
    int Contar(int tallerId);
    void Agregar(Vehiculo vehiculo);
    void Eliminar(Vehiculo vehiculo);
    void Guardar();
}

public interface ITrabajoRepository
{
    Trabajo? ObtenerConDetalle(int tallerId, int id);                 // con su tipo y su mecánico
    List<Trabajo> ListarConDetalle(int tallerId);
    bool MecanicoTieneTrabajos(int mecanicoId);
    List<TipoTrabajo> ListarTipos();                                  // el catálogo es igual para todos los talleres
    bool ExisteTipo(int id);
    void Agregar(Trabajo trabajo);
    void Guardar();
}

public interface IMecanicoRepository
{
    List<Mecanico> Listar(int tallerId);
    Mecanico? Obtener(int tallerId, int id);
    int Contar(int tallerId);
    void Agregar(Mecanico mecanico);
    void Eliminar(Mecanico mecanico);
    void Guardar();
}

public interface IUsuarioRepository
{
    Usuario? BuscarPorNombre(string nombreUsuario);                   // junto con su taller
    void AgregarTaller(Taller taller);                                // el taller trae adentro a su primer usuario
    void Guardar();
}
