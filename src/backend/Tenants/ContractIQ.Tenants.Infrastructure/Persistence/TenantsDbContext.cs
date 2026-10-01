using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Tenants.Domain.Aggregates;
using ContractIQ.Tenants.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContractIQ.Tenants.Infrastructure.Persistence;

public class TenantsDbContext(DbContextOptions<TenantsDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new TenantConfiguration());
    }
}

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasConversion(id => id.Value, value => new TenantId(value));

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);

        builder.OwnsOne(x => x.Settings, s =>
        {
            s.ToJson();
        });
    }
}

public class TenantRepository(TenantsDbContext dbContext) : ITenantRepository
{
    public async Task<Tenant?> GetByIdAsync(TenantId id, CancellationToken ct = default)
    {
        return await dbContext.Tenants.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<IReadOnlyList<Tenant>> ListAsync(CancellationToken ct = default)
    {
        var list = await dbContext.Tenants.ToListAsync(ct);
        return list;
    }

    public async Task AddAsync(Tenant tenant, CancellationToken ct = default)
    {
        await dbContext.Tenants.AddAsync(tenant, ct);
    }

    public Task UpdateAsync(Tenant tenant, CancellationToken ct = default)
    {
        dbContext.Tenants.Update(tenant);
        return Task.CompletedTask;
    }
}
