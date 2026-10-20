namespace TallerApp.Models;

// CATÁLOGO para el combo de "tipo de trabajo" (Frenos, Cambio de aceite, etc.). Es el mismo para todos los talleres.
// Lo carga el sistema la primera vez (Data/DatosIniciales.cs). Tabla "TiposTrabajo".
public class TipoTrabajo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
}
