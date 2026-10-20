using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TallerApp.Data;

// Solo lo usan los comandos "dotnet ef migrations ..." para saber a qué base conectarse.
// Lee la misma cadena de conexión que usa la API.
public class TallerDbContextFactory : IDesignTimeDbContextFactory<TallerDbContext>
{
    public TallerDbContext CreateDbContext(string[] args)
    {
        var configuracion = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var opciones = new DbContextOptionsBuilder<TallerDbContext>()
            .UseSqlServer(configuracion.GetConnectionString("TallerDb"))
            .Options;
        return new TallerDbContext(opciones);
    }
}
