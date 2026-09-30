using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class OrganizacionConfiguration : IEntityTypeConfiguration<Organizacion>
{
    public void Configure(EntityTypeBuilder<Organizacion> builder)
    {
        builder.ToTable("Organizacion", "dbo");
        builder.HasKey(e => e.IdOrganizacion);
        builder.Property(e => e.IdOrganizacion).ValueGeneratedOnAdd();
        builder.Property(e => e.RazonSocial).HasMaxLength(150).IsUnicode(false);
        builder.Property(e => e.CUIT).HasMaxLength(20).IsUnicode(false);
        builder.Property(e => e.FechaAlta).HasColumnType("datetime");
        builder.Property(e => e.Logo).HasMaxLength(255).IsUnicode(false);
        builder.Property(e => e.ZonaHoraria).HasMaxLength(50).IsUnicode(false);

        builder.HasOne(e => e.TipoOrganizacion)
            .WithMany()
            .HasForeignKey(e => e.IdTipoOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
