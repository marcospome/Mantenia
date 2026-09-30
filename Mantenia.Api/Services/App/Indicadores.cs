using System.Globalization;
using System.Text.RegularExpressions;
using Mantenia.Api.DTOs.App;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Services.App;

/// <summary>
/// Cálculos de mantenimiento a partir del historial de órdenes de trabajo.
///
/// - Una orden es "preventiva" si su TipoTrabajo contiene alguna de las palabras de <see cref="PalabrasPreventivo"/>
///   (service, inspección, lubricación, revisión, cambio de aceite/filtro...). El resto se cuenta como falla.
/// - MTBF (días) = días observados desde la primera orden / cantidad de fallas.
/// - Probabilidad de falla = días desde la última falla / MTBF (tope 99 %).
/// - Taller: el kilometraje de ingreso se guarda al inicio de la descripción de la OT ("Km ingreso: 128400"),
///   y el próximo service se estima cada <see cref="IntervaloServiceKm"/> km desde el último service.
/// </summary>
public static partial class Indicadores
{
    public const int IntervaloServiceKm = 10_000;
    public const int AvisoServiceKm = 1_000;

    public static readonly CultureInfo Cultura = CultureInfo.GetCultureInfo("es-AR");

    private static readonly string[] PalabrasPreventivo =
    [
        "prevent", "servic", "inspecc", "lubric", "revisi", "aceite", "filtro",
        "alinea", "balanceo", "control", "calibr", "limpieza", "rutina",
    ];

    private static readonly string[] PalabrasDetenido = ["deten", "fuera de servicio", "parad", "baja"];

    [GeneratedRegex(@"^\s*Km ingreso:\s*([\d\.,]+)\s*(?:\r?\n)?", RegexOptions.IgnoreCase)]
    private static partial Regex KmRegex();

    public static bool EsPreventivo(string? tipoTrabajo)
        => tipoTrabajo is not null
           && PalabrasPreventivo.Any(p => tipoTrabajo.Contains(p, StringComparison.OrdinalIgnoreCase));

    public static bool EsAbierta(OrdenTrabajo orden) => orden.EstadoOrden?.EsFinal != true;

    public static bool EsFalla(OrdenTrabajo orden) => !EsPreventivo(orden.TipoTrabajo?.Descripcion);

    public static bool EstadoIndicaDetenido(string? estado)
        => estado is not null && PalabrasDetenido.Any(p => estado.Contains(p, StringComparison.OrdinalIgnoreCase));

    /// <summary>Separa el kilometraje (si lo hay) del texto de la descripción.</summary>
    public static (int? Km, string? Texto) SepararKm(string? descripcion)
    {
        if (string.IsNullOrEmpty(descripcion))
        {
            return (null, descripcion);
        }

        var match = KmRegex().Match(descripcion);
        if (!match.Success)
        {
            return (null, descripcion);
        }

        var digitos = new string(match.Groups[1].Value.Where(char.IsDigit).ToArray());
        int? km = int.TryParse(digitos, out var valor) ? valor : null;
        var resto = descripcion[match.Length..].Trim();
        return (km, resto.Length == 0 ? null : resto);
    }

    public static string? UnirKm(int? km, string? texto)
    {
        texto = string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
        return km is null ? texto : $"Km ingreso: {km}" + (texto is null ? string.Empty : "\n" + texto);
    }

    /// <summary>Horas que el activo estuvo detenido por una falla.</summary>
    public static double HorasDetenido(OrdenTrabajo orden, DateTime ahora)
    {
        if (!EsFalla(orden) || orden.FechaInicio is null)
        {
            return 0;
        }

        var fin = orden.FechaCierre ?? ahora;
        return Math.Max(0, (fin - orden.FechaInicio.Value).TotalHours);
    }

    public static SaludDto CalcularSalud(Activo activo, IReadOnlyList<OrdenTrabajo> ordenes, DateTime ahora)
    {
        var conFecha = ordenes.Where(o => o.FechaCreacion.HasValue).OrderBy(o => o.FechaCreacion).ToList();
        var fallas = conFecha.Where(EsFalla).ToList();

        // --- MTBF y probabilidad
        double? mtbf = null;
        int? diasProxima = null;
        DateTime? fechaProxima = null;
        var probabilidad = 0;

        if (fallas.Count > 0)
        {
            var primera = conFecha[0].FechaCreacion!.Value;
            var observados = Math.Max(1, (ahora - primera).TotalDays);
            mtbf = Math.Max(1, observados / fallas.Count);

            var ultimaFalla = fallas[^1].FechaCreacion!.Value;
            var desde = Math.Max(0, (ahora - ultimaFalla).TotalDays);
            diasProxima = (int)Math.Max(0, Math.Round(mtbf.Value - desde));
            fechaProxima = ultimaFalla.AddDays(mtbf.Value);
            probabilidad = (int)Math.Clamp(Math.Round(100 * desde / mtbf.Value), 0, 99);
        }

        var nivel = probabilidad >= 80 ? "riesgo" : probabilidad >= 60 ? "revisar" : "ok";

        // --- Kilometraje (taller)
        var kms = conFecha
            .Select(o => (Orden: o, Km: SepararKm(o.Descripcion).Km))
            .Where(x => x.Km.HasValue)
            .ToList();

        int? kmActual = kms.Count > 0 ? kms.Max(x => x.Km!.Value) : null;
        int? kmUltimoService = kms
            .Where(x => EsPreventivo(x.Orden.TipoTrabajo?.Descripcion))
            .Select(x => x.Km)
            .DefaultIfEmpty()
            .Max();
        int? kmProximo = kmUltimoService is int ks ? ks + IntervaloServiceKm : null;
        int? kmExcedido = kmActual is int ka && kmProximo is int kp ? ka - kp : null;

        if (kmExcedido > 0)
        {
            nivel = "riesgo";
        }
        else if (kmExcedido >= -AvisoServiceKm && nivel == "ok")
        {
            nivel = "revisar";
        }

        // --- Estado
        var detenido = ordenes.Any(o => EsAbierta(o) && o.FechaInicio.HasValue)
                       || EstadoIndicaDetenido(activo.EstadoActivo?.Descripcion);

        // --- Sugerencia
        string? sugerencia = null;
        if (kmExcedido is int excedido && excedido > 0)
        {
            sugerencia = $"service vencido por {excedido.ToString("N0", Cultura)} km: contactar al cliente";
        }
        else if (kmExcedido >= -AvisoServiceKm && kmProximo is int proximo)
        {
            sugerencia = $"hacer el service antes de los {proximo.ToString("N0", Cultura)} km";
        }
        else if (nivel != "ok" && fechaProxima is DateTime fecha)
        {
            var tipo = conFecha.LastOrDefault(o => EsPreventivo(o.TipoTrabajo?.Descripcion))?.TipoTrabajo?.Descripcion;
            var accion = tipo is null ? "una revisión preventiva" : tipo.ToLower(Cultura);
            var limite = fecha < ahora ? ahora.AddDays(2) : fecha;
            sugerencia = $"programar {accion} antes del {limite.ToString("dd/MM", Cultura)}";
        }

        return new SaludDto(
            mtbf is null ? null : Math.Round(mtbf.Value, 1),
            diasProxima,
            fechaProxima,
            probabilidad,
            nivel,
            detenido,
            ordenes.Count,
            fallas.Count,
            kmActual,
            kmProximo,
            kmExcedido,
            sugerencia);
    }
}
