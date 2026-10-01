using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Interfaces;

public interface ICurrentTenant
{
    TenantId Id { get; }
    string Name { get; }
}
