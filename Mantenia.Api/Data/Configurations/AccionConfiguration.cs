using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class AccionConfiguration : IEntityTypeConfiguration<Accion>
{
    public void Configure(EntityTypeBuilder<Accion> builder)
    {
        builder.ToTable("Accion", "dbo");
        builder.HasKey(e => e.IdAccion);
        builder.Property(e => e.IdAccion).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Version).HasMaxLength(50).IsUnicode(false);
        builder.Property(e => e.Clave).HasMaxLength(50).IsUnicode(false);

        builder.HasOne(e => e.Modulo)
            .WithMany()
            .HasForeignKey(e => e.IdModulo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
