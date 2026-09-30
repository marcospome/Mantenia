namespace Mantenia.Api.Entities;

public class Organizacion
{
    public int IdOrganizacion { get; set; }
    public int? IdTipoOrganizacion { get; set; }
    public string? RazonSocial { get; set; }
    public string? CUIT { get; set; }
    public DateTime? FechaAlta { get; set; }
    public bool? Activo { get; set; }
    public string? Logo { get; set; }
    public string? ZonaHoraria { get; set; }

    // Navegaciones
    public TipoOrganizacion? TipoOrganizacion { get; set; }
}
