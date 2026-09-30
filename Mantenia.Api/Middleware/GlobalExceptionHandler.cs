using Mantenia.Api.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace Mantenia.Api.Middleware;

/// <summary>Convierte excepciones en respuestas ProblemDetails consistentes.</summary>
public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, titulo, detalle) = exception switch
        {
            ConflictException ex => (StatusCodes.Status409Conflict, "Conflicto", ex.Message),
            UnauthorizedAccessException ex => (StatusCodes.Status401Unauthorized, "No autorizado", ex.Message),
            DbUpdateException => (StatusCodes.Status409Conflict, "No se pudo guardar",
                "La operación viola una restricción de la base de datos: el registro tiene datos relacionados o alguna referencia (Id...) no existe."),
            _ => (StatusCodes.Status500InternalServerError, "Error interno", "Ocurrió un error inesperado."),
        };

        if (status >= 500)
        {
            logger.LogError(exception, "Error no controlado");
        }
        else
        {
            logger.LogWarning(exception, "Solicitud rechazada: {Titulo}", titulo);
        }

        httpContext.Response.StatusCode = status;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails =
            {
                Status = status,
                Title = titulo,
                Detail = detalle,
            },
        });
    }
}
