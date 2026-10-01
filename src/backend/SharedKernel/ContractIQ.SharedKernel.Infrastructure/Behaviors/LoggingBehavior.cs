using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;
    private readonly ICurrentTenant _currentTenant;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger, ICurrentTenant currentTenant)
    {
        _logger = logger;
        _currentTenant = currentTenant;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var tenantId = _currentTenant.Id.Value == Guid.Empty ? "System" : _currentTenant.Id.ToString();
        var timer = Stopwatch.StartNew();

        try
        {
            return await next();
        }
        finally
        {
            timer.Stop();
            _logger.LogInformation("Handled {RequestName} for {TenantId} in {ElapsedMs}ms", requestName, tenantId, timer.ElapsedMilliseconds);
        }
    }
}
