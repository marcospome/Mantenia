using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class TipoOrganizacionModuloConfiguration : IEntityTypeConfiguration<TipoOrganizacionModulo>
{
    public void Configure(EntityTypeBuilder<TipoOrganizacionModulo> builder)
    {
        builder.ToTable("TipoOrganizacionModulo", "dbo");
        builder.HasKey(e => e.IdTipoOrganizacionModulo);
        builder.Property(e => e.IdTipoOrganizacionModulo).ValueGeneratedOnAdd();

        builder.HasOne(e => e.TipoOrganizacion)
            .WithMany()
            .HasForeignKey(e => e.IdTipoOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Modulo)
            .WithMany()
            .HasForeignKey(e => e.IdModulo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
