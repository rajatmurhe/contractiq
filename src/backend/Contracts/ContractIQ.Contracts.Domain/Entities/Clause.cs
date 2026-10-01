using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;
using ContractIQ.Contracts.Domain.ValueObjects;

namespace ContractIQ.Contracts.Domain.Entities;

public class Clause : Entity
{
    public ContractId ContractId { get; private set; }
    public ClauseType Type { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public SourceSpan SourceSpan { get; private set; }
    public decimal Confidence { get; private set; }
    public string ExtractedByVersion { get; private set; } = string.Empty;
    public bool CriticVerified { get; private set; }

    public void MarkCriticVerified() => CriticVerified = true;
    public void MarkCriticUnverified() => CriticVerified = false;
}
