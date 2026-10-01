namespace ContractIQ.Contracts.Application.Interfaces;

using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.ValueObjects;

public class ClauseIndexDocument
{
    public required string Id { get; init; }
    public required string Text { get; init; }
    public required string ClauseType { get; init; }
    public required SourceSpan SourceSpan { get; init; }
}

public class ClauseSearchResult
{
    public required string Id { get; init; }
    public required string Text { get; init; }
    public required string ClauseType { get; init; }
    public required decimal Score { get; init; }
}

public interface IVectorSearchService
{
    Task IndexClausesAsync(TenantId tenantId, ContractId contractId, IEnumerable<ClauseIndexDocument> clauses, CancellationToken ct = default);
    Task<IReadOnlyList<ClauseSearchResult>> SearchAsync(TenantId tenantId, string query, int top = 20, CancellationToken ct = default);
    Task DeleteContractAsync(TenantId tenantId, ContractId contractId, CancellationToken ct = default);
}
