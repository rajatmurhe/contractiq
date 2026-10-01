using Microsoft.AspNetCore.Http;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Infrastructure.CurrentTenant;

public class CurrentTenantService(IHttpContextAccessor httpContextAccessor) : ICurrentTenant
{
    public TenantId Id
    {
        get
        {
            var context = httpContextAccessor.HttpContext;
            if (context == null) return new TenantId(Guid.Empty);

            var claim = context.User.Claims.FirstOrDefault(c => c.Type == "tid" || c.Type == "tenant_id");
            if (claim != null && Guid.TryParse(claim.Value, out var tenantId))
            {
                return new TenantId(tenantId);
            }
            return new TenantId(Guid.Empty);
        }
    }

    public string Name
    {
        get
        {
            var context = httpContextAccessor.HttpContext;
            if (context == null) return string.Empty;

            var claim = context.User.Claims.FirstOrDefault(c => c.Type == "tenant_name" || c.Type == "name");
            return claim?.Value ?? string.Empty;
        }
    }
}
