namespace Mantenia.Api.Entities;

/// <summary>Qué acciones (permisos) tiene cada rol.</summary>
public class RolAccion
{
    public int IdRolAccion { get; set; }
    public int? IdAccion { get; set; }
    public int? IdRol { get; set; }

    // Navegaciones
    public Accion? Accion { get; set; }
    public Rol? Rol { get; set; }
}
