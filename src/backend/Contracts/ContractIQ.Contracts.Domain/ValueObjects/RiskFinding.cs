using ContractIQ.Contracts.Domain.Enums;

namespace ContractIQ.Contracts.Domain.ValueObjects;

public readonly record struct RiskFinding(
    string Description,
    RiskLevel Severity,
    SourceSpan Citation,
    string ChunkId,
    ClauseType RelatedClauseType
);
