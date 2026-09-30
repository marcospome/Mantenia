namespace Mantenia.Api.Entities;

public class Suscripcion
{
    public int IdSuscripcion { get; set; }
    public int? IdOrganizacion { get; set; }
    public int? IdPlan { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? Estado { get; set; }

    // Navegaciones
    public Organizacion? Organizacion { get; set; }
    public PlanSaaS? Plan { get; set; }
}
