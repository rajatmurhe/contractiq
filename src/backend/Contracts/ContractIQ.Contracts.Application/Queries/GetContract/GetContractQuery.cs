namespace ContractIQ.Contracts.Application.Queries.GetContract;

using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

public record GetContractQuery(ContractId ContractId, TenantId TenantId) : IRequest<object?>;
