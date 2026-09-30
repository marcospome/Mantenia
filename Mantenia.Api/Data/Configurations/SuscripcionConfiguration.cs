using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class SuscripcionConfiguration : IEntityTypeConfiguration<Suscripcion>
{
    public void Configure(EntityTypeBuilder<Suscripcion> builder)
    {
        builder.ToTable("Suscripcion", "dbo");
        builder.HasKey(e => e.IdSuscripcion);
        builder.Property(e => e.IdSuscripcion).ValueGeneratedOnAdd();
        builder.Property(e => e.FechaInicio).HasColumnType("datetime");
        builder.Property(e => e.FechaFin).HasColumnType("datetime");
        builder.Property(e => e.Estado).HasMaxLength(50).IsUnicode(false);

        builder.HasOne(e => e.Organizacion)
            .WithMany()
            .HasForeignKey(e => e.IdOrganizacion)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Plan)
            .WithMany()
            .HasForeignKey(e => e.IdPlan)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
