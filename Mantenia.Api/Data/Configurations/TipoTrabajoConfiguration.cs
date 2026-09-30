using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class TipoTrabajoConfiguration : IEntityTypeConfiguration<TipoTrabajo>
{
    public void Configure(EntityTypeBuilder<TipoTrabajo> builder)
    {
        builder.ToTable("TipoTrabajo", "dbo");
        builder.HasKey(e => e.IdTipoTrabajo);
        builder.Property(e => e.IdTipoTrabajo).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);

        builder.HasOne(e => e.CategoriaActivo)
            .WithMany()
            .HasForeignKey(e => e.IdCategoriaActivo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
