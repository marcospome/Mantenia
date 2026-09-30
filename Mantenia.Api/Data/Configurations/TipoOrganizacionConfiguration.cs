using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class TipoOrganizacionConfiguration : IEntityTypeConfiguration<TipoOrganizacion>
{
    public void Configure(EntityTypeBuilder<TipoOrganizacion> builder)
    {
        builder.ToTable("TipoOrganizacion", "dbo");
        builder.HasKey(e => e.IdTipoOrganizacion);
        builder.Property(e => e.IdTipoOrganizacion).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
    }
}
