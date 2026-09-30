using System.Text;
using Mantenia.Api.Configuration;
using Mantenia.Api.Data;
using Mantenia.Api.Interfaces;
using Mantenia.Api.Middleware;
using Mantenia.Api.OpenApi;
using Mantenia.Api.Services;
using Mantenia.Api.Services.App;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Mantenia.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPersistencia(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ConexionSql")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'ConnectionStrings:ConexionSql'.");

        services.AddDbContext<ManteniaDbContext>(options => options.UseSqlServer(connectionString));
        return services;
    }

    public static IServiceCollection AddSeguridadJwt(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.Seccion))
            .Validate(o => Encoding.UTF8.GetByteCount(o.Key) >= 32, "Jwt:Key debe tener al menos 32 caracteres.")
            .Validate(o => o.ExpiracionHoras > 0, "Jwt:ExpiracionHoras debe ser mayor a 0.")
            .ValidateOnStart();

        services.AddOptions<AuthOptions>().Bind(configuration.GetSection(AuthOptions.Seccion));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
            {
                var jwt = jwtOptions.Value;
                options.MapInboundClaims = false; // conserva los nombres cortos: sub, email, name, role
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = AppClaims.Nombre,
                    RoleClaimType = AppClaims.Rol,
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(Politicas.Sistemas, p => p.RequireAuthenticatedUser()
                .AddRequirements(new RolRequerido(Roles.Sistemas)));
            options.AddPolicy(Politicas.AjustesOrganizacion, p => p.RequireAuthenticatedUser()
                .AddRequirements(new RolRequerido(Roles.Administrador, Roles.Sistemas)));

            // Una política por acción: "Permiso:ordenes.crear", "Permiso:activos.gestionar"...
            foreach (var clave in Acciones.Todas)
            {
                options.AddPolicy(Politicas.Prefijo + clave, p => p.RequireAuthenticatedUser()
                    .AddRequirements(new PermisoRequerido(clave)));
            }
        });
        services.AddScoped<IAuthorizationHandler, RolRequeridoHandler>();
        services.AddScoped<IAuthorizationHandler, PermisoRequeridoHandler>();

        services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
        services.AddSingleton<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }

    public static IServiceCollection AddAplicacion(this IServiceCollection services)
    {
        // Endpoints de la app mobile (/api/app)
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<DatosOrganizacion>();
        services.AddScoped<IContextoAppService, ContextoAppService>();
        services.AddScoped<IActivosAppService, ActivosAppService>();
        services.AddScoped<IOrdenesAppService, OrdenesAppService>();
        services.AddScoped<IDashboardAppService, DashboardAppService>();
        services.AddScoped<IAjustesAppService, AjustesAppService>();
        services.AddScoped<ISistemasAppService, SistemasAppService>();

        services.AddControllers();
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddOpenApi(options => options.AddDocumentTransformer<BearerSecuritySchemeTransformer>());
        return services;
    }
}
