using System.ComponentModel.DataAnnotations;
using TallerApp.Models;

namespace TallerApp.DTOs;

public class MecanicoDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    public string? Nombre { get; set; }

    [Required(ErrorMessage = "La especialidad es obligatoria")]
    public string? Especialidad { get; set; }

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    public string? Telefono { get; set; }

    public static MecanicoDto Desde(Mecanico m) =>
        new() { Id = m.Id, Nombre = m.Nombre, Especialidad = m.Especialidad, Telefono = m.Telefono };
}
