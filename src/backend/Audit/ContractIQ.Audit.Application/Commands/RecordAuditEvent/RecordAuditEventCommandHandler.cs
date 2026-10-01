using ContractIQ.Audit.Domain.Entities;
using ContractIQ.Audit.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Audit.Application.Commands.RecordAuditEvent;

public sealed class RecordAuditEventCommandHandler(IAuditEventRepository repository)
    : IRequestHandler<RecordAuditEventCommand, Guid>
{
    public async Task<Guid> Handle(RecordAuditEventCommand cmd, CancellationToken ct)
    {
        var latest = await repository.GetLatestAsync(cmd.TenantId, ct);
        var previousHash = latest?.Hash ?? "GENESIS";
        var now = DateTimeOffset.UtcNow;
        var hash = AuditEvent.ComputeHash(previousHash, cmd.EventType, now, cmd.PayloadJson);

        var ev = new AuditEvent
        {
            TenantId = cmd.TenantId,
            EventType = cmd.EventType,
            ActorId = cmd.ActorId,
            ResourceId = cmd.ResourceId,
            Payload = cmd.PayloadJson,
            PreviousHash = previousHash,
            Hash = hash,
            OccurredAt = now,
            ModelId = cmd.ModelId,
            ModelVersion = cmd.ModelVersion,
            PromptVersion = cmd.PromptVersion,
            AgentVersion = cmd.AgentVersion,
            WorkflowVersion = cmd.WorkflowVersion,
            ChunkIds = cmd.ChunkIds,
            ToolCalls = cmd.ToolCalls,
            HumanApprover = cmd.HumanApprover,
        };

        await repository.AppendAsync(ev, ct);
        return ev.Id.Value;
    }
}
