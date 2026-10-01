using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Aggregates;

namespace ContractIQ.Workflow.Domain.Interfaces;

public interface IWorkflowRunRepository
{
    Task<WorkflowRun?> GetByIdAsync(WorkflowRunId id, TenantId tenantId, CancellationToken ct = default);
    Task<PaginatedResult<WorkflowRun>> ListPendingApprovalsAsync(TenantId tenantId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(WorkflowRun run, CancellationToken ct = default);
    Task UpdateAsync(WorkflowRun run, CancellationToken ct = default);
}
