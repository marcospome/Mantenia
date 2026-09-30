namespace Mantenia.Api.Entities;

public class TipoTrabajoEstadoOrden
{
    public int IdTipoTrabajoEstadoOrden { get; set; }
    public int? IdEstadoOrden { get; set; }
    public int? IdTipoTrabajo { get; set; }

    // Navegaciones
    public EstadoOrden? EstadoOrden { get; set; }
    public TipoTrabajo? TipoTrabajo { get; set; }
}
