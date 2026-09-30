namespace Mantenia.Api.Entities;

public class OrdenTrabajoDetalle
{
    public int IdOrdenTrabajoDetalle { get; set; }
    public int? IdOrdenTrabajo { get; set; }
    public string? Repuesto { get; set; }
    public int? Cantidad { get; set; }
    public decimal? Costo { get; set; }
    public DateTime? FechaCreacion { get; set; }

    // Navegaciones
    public OrdenTrabajo? OrdenTrabajo { get; set; }
}
