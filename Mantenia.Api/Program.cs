using Mantenia.Api.Extensions;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddPersistencia(builder.Configuration)
    .AddSeguridadJwt(builder.Configuration)
    .AddAplicacion();

builder.Services.AddCors(options =>
{
    var origenes = builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? [];
    options.AddDefaultPolicy(policy => policy
        .WithOrigins(origenes)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                 // /openapi/v1.json
    app.MapScalarApiReference();      // /scalar/v1  (interfaz para probar la API)
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
