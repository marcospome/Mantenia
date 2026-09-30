using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class OrdenTrabajoDetalleConfiguration : IEntityTypeConfiguration<OrdenTrabajoDetalle>
{
    public void Configure(EntityTypeBuilder<OrdenTrabajoDetalle> builder)
    {
        builder.ToTable("OrdenTrabajoDetalle", "dbo");
        builder.HasKey(e => e.IdOrdenTrabajoDetalle);
        builder.Property(e => e.IdOrdenTrabajoDetalle).ValueGeneratedOnAdd();
        builder.Property(e => e.Repuesto).HasMaxLength(150).IsUnicode(false);
        builder.Property(e => e.Costo).HasPrecision(18, 2);
        builder.Property(e => e.FechaCreacion).HasColumnType("datetime");

        builder.HasOne(e => e.OrdenTrabajo)
            .WithMany()
            .HasForeignKey(e => e.IdOrdenTrabajo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
