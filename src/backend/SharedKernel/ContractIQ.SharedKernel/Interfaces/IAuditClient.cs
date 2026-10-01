using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Interfaces;

public interface IAuditClient
{
    Task RecordAsync(AuditEventRequest request, CancellationToken cancellationToken = default);
}

public record AuditEventRequest(
    TenantId TenantId,
    string EventType,
    string ActorId,
    string ResourceId,
    object Payload,
    string? ModelId = null,
    string? ModelVersion = null,
    string? PromptVersion = null,
    string? AgentVersion = null,
    string? WorkflowVersion = null,
    string[]? ChunkIds = null,
    object? ToolCalls = null,
    string? HumanApprover = null
);
