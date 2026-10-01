using ContractIQ.Audit.Domain.Entities;
using ContractIQ.Audit.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Audit.Application.Queries.VerifyChain;

public sealed class VerifyAuditChainQueryHandler(IAuditEventRepository repository)
    : IRequestHandler<VerifyAuditChainQuery, VerifyAuditChainResult>
{
    public async Task<VerifyAuditChainResult> Handle(VerifyAuditChainQuery query, CancellationToken ct)
    {
        var events = await repository.GetAllOrderedAsync(query.TenantId, ct);
        if (events.Count == 0) return new VerifyAuditChainResult(true, null);

        var previousHash = "GENESIS";
        foreach (var ev in events)
        {
            var expected = AuditEvent.ComputeHash(previousHash, ev.EventType, ev.OccurredAt, ev.Payload);
            if (!string.Equals(expected, ev.Hash, StringComparison.OrdinalIgnoreCase))
                return new VerifyAuditChainResult(false, ev.Id.Value);
            previousHash = ev.Hash;
        }
        return new VerifyAuditChainResult(true, null);
    }
}
