using MediatR;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Behaviors;

public class AuthorizationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly ICurrentTenant _currentTenant;

    public AuthorizationBehavior(ICurrentTenant currentTenant)
    {
        _currentTenant = currentTenant;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is IRequiresTenantAuthorization authRequest)
        {
            // Simple check here assuming request has TenantId property
            var tenantProperty = request.GetType().GetProperty("TenantId");
            if (tenantProperty != null)
            {
                var tenantId = tenantProperty.GetValue(request)?.ToString();
                if (tenantId != _currentTenant.Id.ToString())
                {
                    throw new UnauthorizedAccessException("Tenant mismatch");
                }
            }
        }
        return await next();
    }
}
