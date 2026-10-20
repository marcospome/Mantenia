namespace TallerApp.Models;

// ENTIDAD PRINCIPAL. Cada propiedad es una columna de la tabla "Vehiculos".
public class Vehiculo
{
    public int Id { get; set; }                       // clave primaria
    public string Patente { get; set; } = "";
    public string Marca { get; set; } = "";
    public string Modelo { get; set; } = "";
    public string Color { get; set; } = "";
    public string Combustible { get; set; } = "";
    public DateTime FechaCompra { get; set; }
    public int PotenciaHp { get; set; }
    public string Propietario { get; set; } = "";
    public string Email { get; set; } = "";
    public string Telefono { get; set; } = "";

    public int TallerId { get; set; }                 // de qué taller es 

    public List<Trabajo> Trabajos { get; set; } = []; // RELACIÓN: un vehículo tiene muchos trabajos
}
