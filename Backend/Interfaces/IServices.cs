using TallerApp.DTOs;
using TallerApp.Services;

namespace TallerApp.Interfaces;

// Los contratos de la capa de NEGOCIO. Los controllers piden estas interfaces.
// Reciben y devuelven DTOs (nunca models) y usan Resultado<T> para avisar si algo salió mal.
// Todos reciben el tallerId, que sale del token del usuario.

public interface IVehiculoService
{
    List<VehiculoDto> Listar(int tallerId, string? patente, string? propietario);
    VehiculoDetalleDto? Obtener(int tallerId, int id);
    Resultado<VehiculoDto> Crear(int tallerId, VehiculoDto dto);
    Resultado<VehiculoDto> Modificar(int tallerId, int id, VehiculoDto dto);
    Resultado<bool> Eliminar(int tallerId, int id);
}

public interface ITrabajoService
{
    List<TipoTrabajoDto> ListarTipos();
    Resultado<TrabajoDto> Agregar(int tallerId, int vehiculoId, NuevoTrabajoDto dto);
    Resultado<TrabajoDto> Avanzar(int tallerId, int id);
}

public interface IMecanicoService
{
    List<MecanicoDto> Listar(int tallerId);
    MecanicoDto Agregar(int tallerId, MecanicoDto dto);
    Resultado<bool> Eliminar(int tallerId, int id);
}

public interface IPanelService
{
    PanelDto Obtener(int tallerId);
}

public interface IAutenticacionService
{
    SesionDto? Validar(string usuario, string clave);                 // null si los datos no coinciden
    Resultado<SesionDto> Registrar(RegistroDto dto);                  // alta de un taller nuevo con su primer usuario
}
