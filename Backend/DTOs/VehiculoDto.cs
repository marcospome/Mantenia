using System.ComponentModel.DataAnnotations;
using TallerApp.Models;
using TallerApp.Validations;

namespace TallerApp.DTOs;

// Se usa en lugar del model para no exponer columnas internas (como TallerId) y para tener las validaciones acá.
// Las etiquetas [ ] son las validaciones responde 400 si fallan.
public class VehiculoDto
{
    public int Id { get; set; }

    [Required(ErrorMessage = "La patente es obligatoria")]
    [StringLength(10)]
    public string? Patente { get; set; }

    [Required(ErrorMessage = "La marca es obligatoria")]
    public string? Marca { get; set; }

    [Required(ErrorMessage = "El modelo es obligatorio")]
    public string? Modelo { get; set; }

    [Required(ErrorMessage = "El color es obligatorio")]
    public string? Color { get; set; }

    // Campo de tipo LISTA (combo): el front ofrece Nafta, Diésel, GNC, Eléctrico, Híbrido
    [Required(ErrorMessage = "Elegí un combustible")]
    public string? Combustible { get; set; }

    // Campo de tipo FECHA, con validación propia (no puede ser futura)
    [Required(ErrorMessage = "La fecha de compra es obligatoria")]
    [DataType(DataType.Date)]
    [FechaNoFutura]
    public DateTime? FechaCompra { get; set; }

    // Campo NUMÉRICO con rango de 1 a 1000
    [Required(ErrorMessage = "La potencia es obligatoria")]
    [Range(1, 1000, ErrorMessage = "La potencia debe estar entre 1 y 1000")]
    public int? PotenciaHp { get; set; }

    [Required(ErrorMessage = "El propietario es obligatorio")]
    public string? Propietario { get; set; }

    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "Email inválido")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    public string? Telefono { get; set; }

    // Del model al DTO (para responder)
    public static VehiculoDto Desde(Vehiculo v) => new()
    {
        Id = v.Id, Patente = v.Patente, Marca = v.Marca, Modelo = v.Modelo, Color = v.Color,
        Combustible = v.Combustible, FechaCompra = v.FechaCompra, PotenciaHp = v.PotenciaHp,
        Propietario = v.Propietario, Email = v.Email, Telefono = v.Telefono,
    };

    // Del DTO al model (para guardar). Sirve tanto para el alta como para la modificación.
    public void CopiarEn(Vehiculo v)
    {
        v.Patente = Patente!.Trim().ToUpper();       // regla: la patente va en mayúsculas
        v.Marca = Marca!; v.Modelo = Modelo!; v.Color = Color!; v.Combustible = Combustible!;
        v.FechaCompra = FechaCompra!.Value; v.PotenciaHp = PotenciaHp!.Value;
        v.Propietario = Propietario!; v.Email = Email!; v.Telefono = Telefono!;
    }
}

// El detalle de un vehículo: sus datos más la lista de sus trabajos
public class VehiculoDetalleDto : VehiculoDto
{
    public List<TrabajoDto> Trabajos { get; set; } = [];

    public static VehiculoDetalleDto DesdeConTrabajos(Vehiculo v) => new()
    {
        Id = v.Id, Patente = v.Patente, Marca = v.Marca, Modelo = v.Modelo, Color = v.Color,
        Combustible = v.Combustible, FechaCompra = v.FechaCompra, PotenciaHp = v.PotenciaHp,
        Propietario = v.Propietario, Email = v.Email, Telefono = v.Telefono,
        Trabajos = v.Trabajos.Select(TrabajoDto.Desde).ToList(),
    };
}
