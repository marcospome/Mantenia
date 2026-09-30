namespace Mantenia.Api.Common;

/// <summary>Regla de negocio violada que se responde como HTTP 409.</summary>
public sealed class ConflictException(string message) : Exception(message);
