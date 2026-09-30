namespace Mantenia.Api.Entities;

public class TipoOrganizacionModulo
{
    public int IdTipoOrganizacionModulo { get; set; }
    public int? IdTipoOrganizacion { get; set; }
    public int? IdModulo { get; set; }

    // Navegaciones
    public TipoOrganizacion? TipoOrganizacion { get; set; }
    public Modulo? Modulo { get; set; }
}
