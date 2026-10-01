using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Audit.Domain.Entities;

namespace ContractIQ.Audit.Domain.Interfaces;

public interface IAuditEventRepository
{
    Task<AuditEvent?> GetLatestAsync(TenantId tenantId, CancellationToken ct = default);
    Task<PaginatedResult<AuditEvent>> ListAsync(TenantId tenantId, string? runId, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<AuditEvent>> GetAllOrderedAsync(TenantId tenantId, CancellationToken ct = default);
    Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default);
}
