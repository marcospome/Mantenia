using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class CategoriaActivoConfiguration : IEntityTypeConfiguration<CategoriaActivo>
{
    public void Configure(EntityTypeBuilder<CategoriaActivo> builder)
    {
        builder.ToTable("CategoriaActivo", "dbo");
        builder.HasKey(e => e.IdCategoriaActivo);
        builder.Property(e => e.IdCategoriaActivo).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);

        builder.HasOne(e => e.Organizacion)
            .WithMany()
            .HasForeignKey(e => e.IdOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
