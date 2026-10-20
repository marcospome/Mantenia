using Microsoft.EntityFrameworkCore;
using TallerApp.Models;

namespace TallerApp.Data;

// El "DbContext" es la entrada a la base. Cada DbSet representa una tabla;
public class TallerDbContext(DbContextOptions<TallerDbContext> opciones) : DbContext(opciones)
{
    public DbSet<Taller> Talleres => Set<Taller>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Vehiculo> Vehiculos => Set<Vehiculo>();
    public DbSet<Trabajo> Trabajos => Set<Trabajo>();
    public DbSet<Mecanico> Mecanicos => Set<Mecanico>();
    public DbSet<TipoTrabajo> TiposTrabajo => Set<TipoTrabajo>();

    // Reglas de la base
    protected override void OnModelCreating(ModelBuilder modelo)
    {
        modelo.Entity<Vehiculo>().Property(v => v.Patente).HasMaxLength(10);
        modelo.Entity<Vehiculo>().HasIndex(v => new { v.TallerId, v.Patente }).IsUnique();   // la patente no se repite DENTRO de un taller
        modelo.Entity<Usuario>().Property(u => u.NombreUsuario).HasMaxLength(50);
        modelo.Entity<Usuario>().HasIndex(u => u.NombreUsuario).IsUnique();                  // el usuario no se repite en todo el sistema
        modelo.Entity<Trabajo>().Property(t => t.Costo).HasPrecision(18, 2);

        // Un mecánico o un tipo de trabajo que ya tiene trabajos NO se puede borrar (Restrict).
        // En cambio, al borrar un vehículo se borran sus trabajos (Cascade, el comportamiento por defecto).
        modelo.Entity<Trabajo>().HasOne(t => t.Mecanico).WithMany()
            .HasForeignKey(t => t.MecanicoId).OnDelete(DeleteBehavior.Restrict);
        modelo.Entity<Trabajo>().HasOne(t => t.TipoTrabajo).WithMany()
            .HasForeignKey(t => t.TipoTrabajoId).OnDelete(DeleteBehavior.Restrict);
    }
}
