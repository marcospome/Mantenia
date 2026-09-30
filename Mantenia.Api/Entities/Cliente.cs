namespace Mantenia.Api.Entities;

public class Cliente
{
    public int IdCliente { get; set; }
    public int? IdOrganizacion { get; set; }
    public string? Nombre { get; set; }
    public string? Apellido { get; set; }
    public string? Telefono { get; set; }
    public string? Email { get; set; }

    // Navegaciones
    public Organizacion? Organizacion { get; set; }
}
