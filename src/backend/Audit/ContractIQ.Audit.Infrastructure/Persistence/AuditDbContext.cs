using ContractIQ.Audit.Domain.Entities;
using ContractIQ.Audit.Domain.Interfaces;
using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContractIQ.Audit.Infrastructure.Persistence;

public class AuditDbContext(DbContextOptions<AuditDbContext> options) : DbContext(options)
{
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new AuditEventConfiguration());
    }
}

public class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("AuditEvents");
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasConversion(id => id.Value, value => new AuditEventId(value));
            
        builder.Property(x => x.TenantId)
            .HasConversion(id => id.Value, value => new TenantId(value));

        builder.Property(x => x.Hash).IsRequired().HasMaxLength(64);
        builder.Property(x => x.PreviousHash).IsRequired().HasMaxLength(64);
        
        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => x.ResourceId);
        builder.HasIndex(x => x.OccurredAt);
    }
}

public class AuditEventRepository(AuditDbContext dbContext) : IAuditEventRepository
{
    public Task<AuditEvent?> GetLatestAsync(TenantId tenantId, CancellationToken ct = default)
        => dbContext.AuditEvents
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.OccurredAt)
            .FirstOrDefaultAsync(ct);

    public async Task<PaginatedResult<AuditEvent>> ListAsync(TenantId tenantId, string? runId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.AuditEvents.Where(x => x.TenantId == tenantId);
        if (!string.IsNullOrEmpty(runId)) query = query.Where(x => x.ResourceId == runId);
        
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.OccurredAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            
        return new PaginatedResult<AuditEvent>(items, total, page, pageSize);
    }

    public async Task<IReadOnlyList<AuditEvent>> GetAllOrderedAsync(TenantId tenantId, CancellationToken ct = default)
        => await dbContext.AuditEvents
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.OccurredAt)
            .ToListAsync(ct);

    public async Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default)
        => await dbContext.AuditEvents.AddAsync(auditEvent, ct);
}
