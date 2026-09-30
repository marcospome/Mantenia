using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class RolAccionConfiguration : IEntityTypeConfiguration<RolAccion>
{
    public void Configure(EntityTypeBuilder<RolAccion> builder)
    {
        builder.ToTable("RolAccion", "dbo");
        builder.HasKey(e => e.IdRolAccion);
        builder.Property(e => e.IdRolAccion).ValueGeneratedOnAdd();

        builder.HasOne(e => e.Accion)
            .WithMany()
            .HasForeignKey(e => e.IdAccion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Rol)
            .WithMany()
            .HasForeignKey(e => e.IdRol)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
