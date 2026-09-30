namespace Mantenia.Api.Entities;

public class OrdenTrabajo
{
    public int IdOrdenTrabajo { get; set; }
    public int? IdActivo { get; set; }
    public int? IdTipoTrabajo { get; set; }
    public int? IdEstadoOrden { get; set; }
    public int? IdUsuario { get; set; }
    public int? IdPrioridad { get; set; }
    public DateTime? FechaCreacion { get; set; }
    public DateTime? FechaProgramada { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaCierre { get; set; }
    public string? Descripcion { get; set; }
    public string? Diagnostico { get; set; }
    public decimal? Importe { get; set; }

    // Navegaciones
    public Activo? Activo { get; set; }
    public TipoTrabajo? TipoTrabajo { get; set; }
    public EstadoOrden? EstadoOrden { get; set; }
    public Usuario? Usuario { get; set; }
    public Prioridad? Prioridad { get; set; }
}
