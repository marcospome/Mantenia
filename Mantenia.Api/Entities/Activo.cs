namespace Mantenia.Api.Entities;

public class Activo
{
    public int IdActivo { get; set; }
    public int? IdOrganizacion { get; set; }
    public int? IdCategoriaActivo { get; set; }
    public int? IdCliente { get; set; }
    public int? IdUbicacion { get; set; }
    public int? IdEstadoActivo { get; set; }
    public string? Identificador { get; set; }
    public string? Nombre { get; set; }
    public string? Marca { get; set; }
    public string? Modelo { get; set; }

    // Navegaciones
    public Organizacion? Organizacion { get; set; }
    public CategoriaActivo? CategoriaActivo { get; set; }
    public Cliente? Cliente { get; set; }
    public Ubicacion? Ubicacion { get; set; }
    public EstadoActivo? EstadoActivo { get; set; }
}
