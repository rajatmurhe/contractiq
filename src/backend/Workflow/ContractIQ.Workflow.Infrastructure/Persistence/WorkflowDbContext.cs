using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Aggregates;
using ContractIQ.Workflow.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContractIQ.Workflow.Infrastructure.Persistence;

public class WorkflowDbContext(DbContextOptions<WorkflowDbContext> options, ICurrentTenant currentTenant) : DbContext(options)
{
    public DbSet<WorkflowRun> WorkflowRuns => Set<WorkflowRun>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new WorkflowRunConfiguration());
        modelBuilder.Entity<WorkflowRun>().HasQueryFilter(w => w.TenantId == currentTenant.Id);
    }
}

public class WorkflowRunConfiguration : IEntityTypeConfiguration<WorkflowRun>
{
    public void Configure(EntityTypeBuilder<WorkflowRun> builder)
    {
        builder.ToTable("WorkflowRuns");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasConversion(id => id.Value, value => new WorkflowRunId(value));
        builder.Property(x => x.TenantId).HasConversion(id => id.Value, value => new TenantId(value));
        builder.Property(x => x.ContractId).HasConversion(id => id.Value, value => new ContractId(value));
    }
}

public class WorkflowRunRepository(WorkflowDbContext dbContext) : IWorkflowRunRepository
{
    public Task<WorkflowRun?> GetByIdAsync(WorkflowRunId id, TenantId tenantId, CancellationToken ct = default)
        => dbContext.WorkflowRuns.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

    public async Task<PaginatedResult<WorkflowRun>> ListPendingApprovalsAsync(TenantId tenantId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.WorkflowRuns.Where(x => x.TenantId == tenantId && x.Status == WorkflowStatus.AwaitingApproval);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PaginatedResult<WorkflowRun>(items, total, page, pageSize);
    }

    public async Task AddAsync(WorkflowRun run, CancellationToken ct = default)
        => await dbContext.WorkflowRuns.AddAsync(run, ct);

    public Task UpdateAsync(WorkflowRun run, CancellationToken ct = default)
    {
        dbContext.WorkflowRuns.Update(run);
        return Task.CompletedTask;
    }
}
