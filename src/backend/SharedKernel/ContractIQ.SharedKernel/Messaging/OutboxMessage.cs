using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Messaging;

public class OutboxMessage
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EventType { get; init; }
    public required string Payload { get; init; }
    public required TenantId TenantId { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; private set; }
    public int RetryCount { get; private set; }
    public string? Error { get; private set; }

    public void MarkProcessed() => ProcessedAt = DateTimeOffset.UtcNow;
    public void MarkFailed(string error) { Error = error; RetryCount++; }
}
