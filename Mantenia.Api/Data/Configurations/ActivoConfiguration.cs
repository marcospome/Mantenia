using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class ActivoConfiguration : IEntityTypeConfiguration<Activo>
{
    public void Configure(EntityTypeBuilder<Activo> builder)
    {
        builder.ToTable("Activo", "dbo");
        builder.HasKey(e => e.IdActivo);
        builder.Property(e => e.IdActivo).ValueGeneratedOnAdd();
        builder.Property(e => e.Identificador).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Nombre).HasMaxLength(150).IsUnicode(false);
        builder.Property(e => e.Marca).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Modelo).HasMaxLength(100).IsUnicode(false);

        builder.HasOne(e => e.Organizacion)
            .WithMany()
            .HasForeignKey(e => e.IdOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CategoriaActivo)
            .WithMany()
            .HasForeignKey(e => e.IdCategoriaActivo)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Cliente)
            .WithMany()
            .HasForeignKey(e => e.IdCliente)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Ubicacion)
            .WithMany()
            .HasForeignKey(e => e.IdUbicacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.EstadoActivo)
            .WithMany()
            .HasForeignKey(e => e.IdEstadoActivo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
