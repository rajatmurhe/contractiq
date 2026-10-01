namespace ContractIQ.Contracts.Domain.ValueObjects;

public record ContractMetadata(
    string? ContractType,
    string? CounterpartyName,
    DateTimeOffset? EffectiveDate,
    DateTimeOffset? ExpiryDate,
    string? Jurisdiction,
    string? Currency,
    decimal? TotalValue
);
