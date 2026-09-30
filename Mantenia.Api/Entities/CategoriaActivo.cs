namespace Mantenia.Api.Entities;

public class CategoriaActivo
{
    public int IdCategoriaActivo { get; set; }
    public int? IdOrganizacion { get; set; }
    public string? Descripcion { get; set; }

    // Navegaciones
    public Organizacion? Organizacion { get; set; }
}
