using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace TallerApp.OpenApi;

// Le agrega al documento de la API el botón «Authorize» para poder pegar el token y probar los endpoints protegidos.
internal sealed class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument documento, OpenApiDocumentTransformerContext contexto, CancellationToken ct)
    {
        documento.Components ??= new OpenApiComponents();
        documento.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Pegá el token que devuelve POST /api/autenticacion/login",
            },
        };

        // Se marca cada endpoint como protegido (login y registro son los únicos que no lo necesitan)
        foreach (var ruta in documento.Paths)
        {
            if (ruta.Key.Contains("/autenticacion/") || ruta.Value.Operations is null) continue;
            foreach (var operacion in ruta.Value.Operations.Values)
            {
                operacion.Security ??= [];
                operacion.Security.Add(new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("Bearer", documento)] = [],
                });
            }
        }
        return Task.CompletedTask;
    }
}
