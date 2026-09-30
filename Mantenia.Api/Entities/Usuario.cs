namespace Mantenia.Api.Entities;

public class Usuario
{
    public int IdUsuario { get; set; }
    public int? IdOrganizacion { get; set; }
    public int? IdRol { get; set; }
    public string? Nombre { get; set; }
    public string? Apellido { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? ClaveHash { get; set; }
    public bool? Activo { get; set; }

    // Navegaciones
    public Organizacion? Organizacion { get; set; }
    public Rol? Rol { get; set; }
}
