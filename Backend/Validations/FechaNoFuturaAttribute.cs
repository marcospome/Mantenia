using System.ComponentModel.DataAnnotations;

namespace TallerApp.Validations;

// VALIDACIÓN PROPIA: se usa escribiendo [FechaNoFutura] encima de una propiedad de tipo fecha.
// Si la fecha es posterior a hoy, ASP.NET rechaza el pedido con un 400.
public class FechaNoFuturaAttribute : ValidationAttribute
{
    public override bool IsValid(object? valor) => valor is not DateTime fecha || fecha.Date <= DateTime.Today;

    public override string FormatErrorMessage(string nombre) => "La fecha no puede ser futura";
}
