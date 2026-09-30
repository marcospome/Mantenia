namespace Mantenia.Api.Entities;

public class TipoTrabajo
{
    public int IdTipoTrabajo { get; set; }
    public int? IdCategoriaActivo { get; set; }
    public string? Descripcion { get; set; }

    // Navegaciones
    public CategoriaActivo? CategoriaActivo { get; set; }
}
