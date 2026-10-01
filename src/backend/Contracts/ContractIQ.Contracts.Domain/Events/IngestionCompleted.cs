using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;

namespace ContractIQ.Contracts.Domain.Events;
public record IngestionCompleted(ContractId ContractId, TenantId TenantId, RiskLevel RiskLevel) : DomainEvent;
