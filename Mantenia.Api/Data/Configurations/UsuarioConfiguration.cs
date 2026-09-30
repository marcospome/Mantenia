using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuario", "dbo");
        builder.HasKey(e => e.IdUsuario);
        builder.Property(e => e.IdUsuario).ValueGeneratedOnAdd();
        builder.Property(e => e.Nombre).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Apellido).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Email).HasMaxLength(150).IsUnicode(false);
        builder.Property(e => e.Telefono).HasMaxLength(50).IsUnicode(false);
        builder.Property(e => e.ClaveHash).HasMaxLength(255).IsUnicode(false);

        builder.HasOne(e => e.Organizacion)
            .WithMany()
            .HasForeignKey(e => e.IdOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rol)
            .WithMany()
            .HasForeignKey(e => e.IdRol)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
