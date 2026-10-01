using System.Security.Cryptography;
using System.Text;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Audit.Domain.Entities;

public class AuditEvent
{
    public AuditEventId Id { get; init; } = AuditEventId.New();
    public TenantId TenantId { get; init; }
    public required string EventType { get; init; }
    public required string ActorId { get; init; }
    public required string ResourceId { get; init; }
    public required string Payload { get; init; }
    public required string PreviousHash { get; init; }
    public required string Hash { get; init; }
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;

    // AI-specific fields — nullable; only set for AI-generated events
    public string? ModelId { get; init; }
    public string? ModelVersion { get; init; }
    public string? PromptVersion { get; init; }
    public string? AgentVersion { get; init; }
    public string? WorkflowVersion { get; init; }
    public string? ChunkIds { get; init; }        // JSON array
    public string? ToolCalls { get; init; }       // JSON
    public string? HumanApprover { get; init; }

    public static string ComputeHash(string previousHash, string eventType, DateTimeOffset occurredAt, string payload)
    {
        var input = $"{previousHash}|{eventType}|{occurredAt.Ticks}|{payload}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)));
    }
}
