namespace TallerApp.Models;

// Un TALLER MECÁNICO: cada taller que usa el sistema es una fila de la tabla "Talleres".
// Todo lo que carga un taller (usuarios, mecánicos, vehículos) queda relacionado a él con la columna TallerId,
// y por eso un taller nunca ve lo de otro.
public class Taller
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";

    public List<Usuario> Usuarios { get; set; } = [];
    public List<Mecanico> Mecanicos { get; set; } = [];
    public List<Vehiculo> Vehiculos { get; set; } = [];
}
