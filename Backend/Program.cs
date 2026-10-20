using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TallerApp.Data;
using TallerApp.Interfaces;
using TallerApp.OpenApi;
using TallerApp.Repositories;
using TallerApp.Services;

// PROGRAM.CS: el punto de arranque de la API. Acá se "arma" todo lo que la aplicación necesita.
var builder = WebApplication.CreateBuilder(args);

// 1) Controllers: las clases de la carpeta Controllers pasan a ser endpoints.
builder.Services.AddControllers();

// 2) Base de datos: SQL Server. La cadena de conexión está en appsettings.
builder.Services.AddDbContext<TallerDbContext>(opciones =>
    opciones.UseSqlServer(builder.Configuration.GetConnectionString("TallerDb")));

// 3) Seguridad: las rutas protegidas exigen un token JWT firmado con la clave secreta de appsettings.json.
var claveSecreta = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones => opciones.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        IssuerSigningKey = new SymmetricSecurityKey(claveSecreta),
    });

// 4) Inyección de dependencias: se le avisa a .NET qué clase cumple cada interfaz.
//    Después, cada clase solo "pide" en su constructor la interfaz que necesita y .NET le entrega la implementación.
builder.Services.AddScoped<IVehiculoRepository, VehiculoRepository>();      // Datos
builder.Services.AddScoped<ITrabajoRepository, TrabajoRepository>();
builder.Services.AddScoped<IMecanicoRepository, MecanicoRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IVehiculoService, VehiculoService>();            // Negocio
builder.Services.AddScoped<ITrabajoService, TrabajoService>();
builder.Services.AddScoped<IMecanicoService, MecanicoService>();
builder.Services.AddScoped<IPanelService, PanelService>();
builder.Services.AddScoped<IAutenticacionService, AutenticacionService>();

// 5) Documentación de la API para probar los endpoints desde el navegador.
builder.Services.AddOpenApi(opciones => opciones.AddDocumentTransformer<BearerSecuritySchemeTransformer>());

var app = builder.Build();

// 6) Al arrancar: crear la base (o aplicar las migraciones pendientes).
using (var alcance = app.Services.CreateScope())
    alcance.ServiceProvider.GetRequiredService<TallerDbContext>().Database.Migrate();

app.MapOpenApi();               // /openapi/v1.json  (la descripción de todos los endpoints)
app.MapScalarApiReference();    // /scalar/v1        (la pantalla para probarlos)

// 7) Pipeline: cada pedido pasa por estos pasos EN ESTE ORDEN.
app.UseAuthentication();   // ¿trae un token válido? (quién sos)
app.UseAuthorization();    // ¿puede entrar a esta ruta? ([Authorize])
app.MapControllers();      // ¿qué controller atiende esta URL?

app.Run();
