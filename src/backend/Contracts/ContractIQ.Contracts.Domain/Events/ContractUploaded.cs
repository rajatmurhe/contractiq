using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Contracts.Domain.Events;
public record ContractUploaded(ContractId ContractId, TenantId TenantId, string Title) : DomainEvent;
