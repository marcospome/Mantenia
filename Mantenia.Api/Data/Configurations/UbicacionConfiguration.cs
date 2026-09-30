using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class UbicacionConfiguration : IEntityTypeConfiguration<Ubicacion>
{
    public void Configure(EntityTypeBuilder<Ubicacion> builder)
    {
        builder.ToTable("Ubicacion", "dbo");
        builder.HasKey(e => e.IdUbicacion);
        builder.Property(e => e.IdUbicacion).ValueGeneratedOnAdd();
        builder.Property(e => e.Direccion).HasMaxLength(200).IsUnicode(false);
        builder.Property(e => e.CodigoPostal).HasMaxLength(20).IsUnicode(false);

        builder.HasOne(e => e.Localidad)
            .WithMany()
            .HasForeignKey(e => e.IdLocalidad)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
