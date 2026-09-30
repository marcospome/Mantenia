using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class EstadoActivoConfiguration : IEntityTypeConfiguration<EstadoActivo>
{
    public void Configure(EntityTypeBuilder<EstadoActivo> builder)
    {
        builder.ToTable("EstadoActivo", "dbo");
        builder.HasKey(e => e.IdEstadoActivo);
        builder.Property(e => e.IdEstadoActivo).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);

        builder.HasOne(e => e.CategoriaActivo)
            .WithMany()
            .HasForeignKey(e => e.IdCategoriaActivo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
