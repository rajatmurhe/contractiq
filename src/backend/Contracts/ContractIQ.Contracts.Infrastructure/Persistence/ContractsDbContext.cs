using ContractIQ.Contracts.Domain.Aggregates;
using ContractIQ.Contracts.Domain.Entities;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContractIQ.Contracts.Infrastructure.Persistence;

public class ContractsDbContext(DbContextOptions<ContractsDbContext> options, ICurrentTenant currentTenant) : DbContext(options)
{
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Clause> Clauses => Set<Clause>();
    public DbSet<RiskReport> RiskReports => Set<RiskReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Contract>().HasQueryFilter(c => c.TenantId == currentTenant.Id);
        modelBuilder.Entity<Clause>().HasQueryFilter(c => EF.Property<TenantId>(c, "TenantId") == currentTenant.Id);
        modelBuilder.Entity<RiskReport>().HasQueryFilter(c => EF.Property<TenantId>(c, "TenantId") == currentTenant.Id);

        modelBuilder.ApplyConfiguration(new ContractConfiguration());
    }
}

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.ToTable("Contracts");
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Id).HasConversion(id => id.Value, value => new ContractId(value));
        builder.Property(x => x.TenantId).HasConversion(id => id.Value, value => new TenantId(value));
        
        builder.OwnsOne(x => x.Metadata, m => { m.ToJson(); });
        
        builder.HasMany(x => x.Clauses).WithOne().HasForeignKey(x => x.ContractId);
        builder.HasOne(x => x.RiskReport).WithOne().HasForeignKey<RiskReport>(x => x.ContractId);
    }
}

public interface IContractRepository
{
    Task<Contract?> GetByIdAsync(ContractId id, TenantId tenantId, CancellationToken ct = default);
    Task AddAsync(Contract contract, CancellationToken ct = default);
    Task UpdateAsync(Contract contract, CancellationToken ct = default);
}

public class ContractRepository(ContractsDbContext dbContext) : IContractRepository
{
    public Task<Contract?> GetByIdAsync(ContractId id, TenantId tenantId, CancellationToken ct = default)
        => dbContext.Contracts
            .Include(c => c.Clauses)
            .Include(c => c.RiskReport)
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId, ct);

    public async Task AddAsync(Contract contract, CancellationToken ct = default)
        => await dbContext.Contracts.AddAsync(contract, ct);

    public Task UpdateAsync(Contract contract, CancellationToken ct = default)
    {
        dbContext.Contracts.Update(contract);
        return Task.CompletedTask;
    }
}
