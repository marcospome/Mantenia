using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class OrdenTrabajoConfiguration : IEntityTypeConfiguration<OrdenTrabajo>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajo> builder)
    {
        builder.ToTable("OrdenTrabajo", "dbo");
        builder.HasKey(e => e.IdOrdenTrabajo);
        builder.Property(e => e.IdOrdenTrabajo).ValueGeneratedOnAdd();
        builder.Property(e => e.FechaCreacion).HasColumnType("datetime");
        builder.Property(e => e.FechaProgramada).HasColumnType("datetime");
        builder.Property(e => e.FechaInicio).HasColumnType("datetime");
        builder.Property(e => e.FechaCierre).HasColumnType("datetime");
        builder.Property(e => e.Descripcion).HasColumnType("varchar(max)").IsUnicode(false);
        builder.Property(e => e.Diagnostico).HasColumnType("varchar(max)").IsUnicode(false);
        builder.Property(e => e.Importe).HasPrecision(18, 2);

        builder.HasOne(e => e.Activo)
            .WithMany()
            .HasForeignKey(e => e.IdActivo)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.TipoTrabajo)
            .WithMany()
            .HasForeignKey(e => e.IdTipoTrabajo)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.EstadoOrden)
            .WithMany()
            .HasForeignKey(e => e.IdEstadoOrden)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Usuario)
            .WithMany()
            .HasForeignKey(e => e.IdUsuario)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Prioridad)
            .WithMany()
            .HasForeignKey(e => e.IdPrioridad)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
