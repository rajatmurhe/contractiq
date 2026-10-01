using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Contracts.Domain.Events;
public record IngestionStarted(ContractId ContractId, TenantId TenantId) : DomainEvent;
