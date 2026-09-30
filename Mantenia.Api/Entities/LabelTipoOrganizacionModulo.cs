namespace Mantenia.Api.Entities;

public class LabelTipoOrganizacionModulo
{
    public int IdLabelTipoOrganizacionModulo { get; set; }
    public int? IdTipoOrganizacionModulo { get; set; }
    public string? Clave { get; set; }
    public string? Valor { get; set; }

    // Navegaciones
    public TipoOrganizacionModulo? TipoOrganizacionModulo { get; set; }
}
