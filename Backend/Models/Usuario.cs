namespace TallerApp.Models;

// Persona que puede iniciar sesión. Pertenece a un taller. Tabla "Usuarios".
// Nunca se guarda la clave: solo su "hash".
public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = "";
    public string ClaveHash { get; set; } = "";

    public int TallerId { get; set; }
    public Taller? Taller { get; set; }
}
