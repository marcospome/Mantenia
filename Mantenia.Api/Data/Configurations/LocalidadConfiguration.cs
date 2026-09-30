using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class LocalidadConfiguration : IEntityTypeConfiguration<Localidad>
{
    public void Configure(EntityTypeBuilder<Localidad> builder)
    {
        builder.ToTable("Localidad", "dbo");
        builder.HasKey(e => e.IdLocalidad);
        builder.Property(e => e.IdLocalidad).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
    }
}
