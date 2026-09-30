namespace Mantenia.Api.Configuration;

public sealed class AuthOptions
{
    public const string Seccion = "Auth";

    /// <summary>
    /// Habilita POST /api/auth/registro sin token. Útil para crear el primer usuario;
    /// conviene desactivarlo en producción.
    /// </summary>
    public bool PermitirRegistro { get; set; }
}
