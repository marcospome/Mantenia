namespace Mantenia.Api.Entities;

public class EstadoActivo
{
    public int IdEstadoActivo { get; set; }
    public int? IdCategoriaActivo { get; set; }
    public string? Descripcion { get; set; }

    // Navegaciones
    public CategoriaActivo? CategoriaActivo { get; set; }
}
