using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Audit.Application.Queries.VerifyChain;

public record VerifyAuditChainQuery(TenantId TenantId) : IRequest<VerifyAuditChainResult>;

public record VerifyAuditChainResult(bool Valid, Guid? BrokenAt);
