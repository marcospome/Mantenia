namespace Mantenia.Api.Entities;

/// <summary>Permiso dentro de un módulo (ej. "Crear Nueva Orden" en Trabajos).</summary>
public class Accion
{
    public int IdAccion { get; set; }
    public int? IdModulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Version { get; set; }

    /// <summary>Código estable que usa la API para aplicar el permiso (ej. "ordenes.crear").</summary>
    public string? Clave { get; set; }

    // Navegaciones
    public Modulo? Modulo { get; set; }
}
