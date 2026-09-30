using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mantenia.Api.Entities;

namespace Mantenia.Api.Data.Configurations;

public sealed class PlanSaaSConfiguration : IEntityTypeConfiguration<PlanSaaS>
{
    public void Configure(EntityTypeBuilder<PlanSaaS> builder)
    {
        builder.ToTable("PlanSaaS", "dbo");
        builder.HasKey(e => e.IdPlan);
        builder.Property(e => e.IdPlan).ValueGeneratedOnAdd();
        builder.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
        builder.Property(e => e.PrecioMensual).HasPrecision(18, 2);
    }
}
