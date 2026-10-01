namespace ContractIQ.Integrations.Domain.Entities;

public class IdempotencyRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ExternalCorrelationId { get; init; }   // {workflowRunId}:{step}
    public required string AdapterName { get; init; }
    public required string ResultJson { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
