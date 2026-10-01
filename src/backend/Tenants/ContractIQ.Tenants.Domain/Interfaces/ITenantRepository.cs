using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Tenants.Domain.Aggregates;

namespace ContractIQ.Tenants.Domain.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(TenantId id, CancellationToken ct = default);
    Task<IReadOnlyList<Tenant>> ListAsync(CancellationToken ct = default);
    Task AddAsync(Tenant tenant, CancellationToken ct = default);
    Task UpdateAsync(Tenant tenant, CancellationToken ct = default);
}
