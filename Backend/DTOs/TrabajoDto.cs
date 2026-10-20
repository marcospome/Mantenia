using System.ComponentModel.DataAnnotations;
using TallerApp.Models;

namespace TallerApp.DTOs;

// Lo que ENTRA al crear un trabajo
public class NuevoTrabajoDto
{
    [Required(ErrorMessage = "Elegí el tipo de trabajo")]
    public int? TipoTrabajoId { get; set; }

    [Required(ErrorMessage = "Elegí un mecánico")]
    public int? MecanicoId { get; set; }

    [Required(ErrorMessage = "La fecha es obligatoria")]
    [DataType(DataType.Date)]
    public DateTime? Fecha { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria")]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "El costo es obligatorio")]
    [Range(1, 1000000, ErrorMessage = "El costo debe estar entre 1 y 1.000.000")]
    public decimal? Costo { get; set; }
}

// Lo que SALE: un trabajo con los nombres ya resueltos (tipo y mecánico), listo para mostrar
public class TrabajoDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } = "";
    public decimal Costo { get; set; }
    public string Estado { get; set; } = "";
    public string TipoTrabajo { get; set; } = "";
    public string Mecanico { get; set; } = "";

    // Necesita el trabajo cargado con su tipo y su mecánico 
    public static TrabajoDto Desde(Trabajo t) => new()
    {
        Id = t.Id, Fecha = t.Fecha, Descripcion = t.Descripcion, Costo = t.Costo, Estado = t.Estado,
        TipoTrabajo = t.TipoTrabajo?.Nombre ?? "", Mecanico = t.Mecanico?.Nombre ?? "",
    };
}

// Un renglón del catálogo (para llenar el combo)
public record TipoTrabajoDto(int Id, string Nombre);
