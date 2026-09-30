using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class ModuloConfiguration : IEntityTypeConfiguration<Modulo>
{
    public void Configure(EntityTypeBuilder<Modulo> builder)
    {
        builder.ToTable("Modulo", "dbo");
        builder.HasKey(e => e.IdModulo);
        builder.Property(e => e.IdModulo).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
    }
}
