using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class TipoTrabajoEstadoOrdenConfiguration : IEntityTypeConfiguration<TipoTrabajoEstadoOrden>
{
    public void Configure(EntityTypeBuilder<TipoTrabajoEstadoOrden> builder)
    {
        builder.ToTable("TipoTrabajoEstadoOrden", "dbo");
        builder.HasKey(e => e.IdTipoTrabajoEstadoOrden);
        builder.Property(e => e.IdTipoTrabajoEstadoOrden).ValueGeneratedOnAdd();

        builder.HasOne(e => e.EstadoOrden)
            .WithMany()
            .HasForeignKey(e => e.IdEstadoOrden)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.TipoTrabajo)
            .WithMany()
            .HasForeignKey(e => e.IdTipoTrabajo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
