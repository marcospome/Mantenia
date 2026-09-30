namespace Mantenia.Api.Entities;

public class Ubicacion
{
    public int IdUbicacion { get; set; }
    public int? IdLocalidad { get; set; }
    public string? Direccion { get; set; }
    public string? CodigoPostal { get; set; }

    // Navegaciones
    public Localidad? Localidad { get; set; }
}
