using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Audit.Application.Commands.RecordAuditEvent;

public record RecordAuditEventCommand(
    TenantId TenantId,
    string EventType,
    string ActorId,
    string ResourceId,
    string PayloadJson,
    string? ModelId = null,
    string? ModelVersion = null,
    string? PromptVersion = null,
    string? AgentVersion = null,
    string? WorkflowVersion = null,
    string? ChunkIds = null,
    string? ToolCalls = null,
    string? HumanApprover = null
) : IRequest<Guid>;
