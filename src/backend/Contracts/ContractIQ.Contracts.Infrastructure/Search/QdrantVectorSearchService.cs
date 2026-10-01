using ContractIQ.Contracts.Application.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Contracts.Infrastructure.Search;

public class QdrantVectorSearchService : IVectorSearchService
{
    public Task IndexClausesAsync(TenantId tenantId, ContractId contractId, IEnumerable<ClauseIndexDocument> clauses, CancellationToken ct = default)
    {
        // Stub for Qdrant clause indexing
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<ClauseSearchResult>> SearchAsync(TenantId tenantId, string query, int top = 20, CancellationToken ct = default)
    {
        // Stub for Qdrant vector search
        IReadOnlyList<ClauseSearchResult> results = Array.Empty<ClauseSearchResult>();
        return Task.FromResult(results);
    }

    public Task DeleteContractAsync(TenantId tenantId, ContractId contractId, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
}
