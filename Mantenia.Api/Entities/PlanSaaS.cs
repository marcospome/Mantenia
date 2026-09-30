namespace Mantenia.Api.Entities;

public class PlanSaaS
{
    public int IdPlan { get; set; }
    public string? Descripcion { get; set; }
    public int? MaxActivos { get; set; }
    public int? MaxUsuarios { get; set; }
    public decimal? PrecioMensual { get; set; }
}
