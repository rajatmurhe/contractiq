using Microsoft.AspNetCore.Http;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Middleware;

public class TenantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ICurrentTenant currentTenant)
    {
        // Skip tenant claim requirement for health checks or public endpoints if needed
        if (context.Request.Path.StartsWithSegments("/health") || context.Request.Path.StartsWithSegments("/swagger"))
        {
            await next(context);
            return;
        }

        var tenantClaim = context.User.Claims.FirstOrDefault(c => c.Type == "tid" || c.Type == "tenant_id")?.Value;
        
        if (string.IsNullOrEmpty(tenantClaim) || !Guid.TryParse(tenantClaim, out _))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Unauthorized: No valid tenant ID claim found.");
            return;
        }

        await next(context);
    }
}
