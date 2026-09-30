using Microsoft.EntityFrameworkCore;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data;

public class ManteniaDbContext(DbContextOptions<ManteniaDbContext> options) : DbContext(options)
{
    public DbSet<Accion> Acciones => Set<Accion>();
    public DbSet<Activo> Activos => Set<Activo>();
    public DbSet<CategoriaActivo> CategoriasActivo => Set<CategoriaActivo>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<EstadoActivo> EstadosActivo => Set<EstadoActivo>();
    public DbSet<EstadoOrden> EstadosOrden => Set<EstadoOrden>();
    public DbSet<LabelTipoOrganizacionModulo> LabelsTipoOrganizacionModulo => Set<LabelTipoOrganizacionModulo>();
    public DbSet<Localidad> Localidades => Set<Localidad>();
    public DbSet<Modulo> Modulos => Set<Modulo>();
    public DbSet<OrdenTrabajo> OrdenesTrabajo => Set<OrdenTrabajo>();
    public DbSet<OrdenTrabajoDetalle> OrdenesTrabajoDetalle => Set<OrdenTrabajoDetalle>();
    public DbSet<Organizacion> Organizaciones => Set<Organizacion>();
    public DbSet<PlanSaaS> PlanesSaaS => Set<PlanSaaS>();
    public DbSet<Prioridad> Prioridades => Set<Prioridad>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<RolAccion> RolesAcciones => Set<RolAccion>();
    public DbSet<Suscripcion> Suscripciones => Set<Suscripcion>();
    public DbSet<TipoOrganizacion> TiposOrganizacion => Set<TipoOrganizacion>();
    public DbSet<TipoOrganizacionModulo> TiposOrganizacionModulo => Set<TipoOrganizacionModulo>();
    public DbSet<TipoTrabajo> TiposTrabajo => Set<TipoTrabajo>();
    public DbSet<TipoTrabajoEstadoOrden> TiposTrabajoEstadoOrden => Set<TipoTrabajoEstadoOrden>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Cada tabla se mapea en su propia clase dentro de Data/Configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ManteniaDbContext).Assembly);
    }
}
