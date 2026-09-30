using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> builder)
    {
        builder.ToTable("Cliente", "dbo");
        builder.HasKey(e => e.IdCliente);
        builder.Property(e => e.IdCliente).ValueGeneratedOnAdd();
        builder.Property(e => e.Nombre).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Apellido).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Telefono).HasMaxLength(50).IsUnicode(false);
        builder.Property(e => e.Email).HasMaxLength(150).IsUnicode(false);

        builder.HasOne(e => e.Organizacion)
            .WithMany()
            .HasForeignKey(e => e.IdOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
