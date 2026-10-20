namespace TallerApp.Models;

// Quien realiza los trabajos. Cada taller tiene los suyos. Tabla "Mecanicos".
public class Mecanico
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string Especialidad { get; set; } = "";
    public string Telefono { get; set; } = "";

    public int TallerId { get; set; }      // de qué taller es
}
