using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class LabelTipoOrganizacionModuloConfiguration : IEntityTypeConfiguration<LabelTipoOrganizacionModulo>
{
    public void Configure(EntityTypeBuilder<LabelTipoOrganizacionModulo> builder)
    {
        builder.ToTable("LabelTipoOrganizacionModulo", "dbo");
        builder.HasKey(e => e.IdLabelTipoOrganizacionModulo);
        builder.Property(e => e.IdLabelTipoOrganizacionModulo).ValueGeneratedOnAdd();
        builder.Property(e => e.Clave).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.Valor).HasMaxLength(255).IsUnicode(false);

        builder.HasOne(e => e.TipoOrganizacionModulo)
            .WithMany()
            .HasForeignKey(e => e.IdTipoOrganizacionModulo)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
