namespace Mantenia.Api.Configuration;

public sealed class JwtOptions
{
    public const string Seccion = "Jwt";

    /// <summary>Clave secreta de firma (HMAC-SHA256). Mínimo 32 bytes.</summary>
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Mantenia.Api";
    public string Audience { get; set; } = "Mantenia.Clientes";
    public int ExpiracionHoras { get; set; } = 24;
}
