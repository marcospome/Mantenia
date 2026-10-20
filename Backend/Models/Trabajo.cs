namespace TallerApp.Models;

// ENTIDAD DE RELACIÓN: un trabajo pertenece a un vehículo, lo hace un mecánico y es de un tipo.
// Tabla "Trabajos". Las propiedades terminadas en "Id" son claves foráneas.
public class Trabajo
{
    public int Id { get; set; }

    public int VehiculoId { get; set; }                  // a qué vehículo pertenece
    public Vehiculo? Vehiculo { get; set; }

    public int TipoTrabajoId { get; set; }               // qué se hizo (catálogo)
    public TipoTrabajo? TipoTrabajo { get; set; }

    public int MecanicoId { get; set; }                  // quién lo hizo
    public Mecanico? Mecanico { get; set; }

    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = "";
    public decimal Costo { get; set; }
    public string Estado { get; set; } = EstadosTrabajo.Pendiente;   // arranca "Pendiente" y avanza de a un paso
}

// Los estados posibles de un trabajo, EN ORDEN. Un trabajo solo puede pasar al siguiente de la lista.
public static class EstadosTrabajo
{
    public const string Pendiente = "Pendiente";
    public const string EnCurso = "En curso";
    public const string Finalizado = "Finalizado";

    public static readonly string[] Orden = [Pendiente, EnCurso, Finalizado];
}
