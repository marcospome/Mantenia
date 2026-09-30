using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class RolConfiguration : IEntityTypeConfiguration<Rol>
{
    public void Configure(EntityTypeBuilder<Rol> builder)
    {
        builder.ToTable("Rol", "dbo");
        builder.HasKey(e => e.IdRol);
        builder.Property(e => e.IdRol).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
    }
}
