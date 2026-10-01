import os

base_dir = "/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/backend"
os.chdir(base_dir)

files = {
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/ICommand.cs": """namespace ContractIQ.SharedKernel.Interfaces;
public interface ICommand { }
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/IRequiresTenantAuthorization.cs": """namespace ContractIQ.SharedKernel.Interfaces;
public interface IRequiresTenantAuthorization { }
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Behaviors/ValidationBehavior.cs": """using FluentValidation;
using MediatR;
using ContractIQ.SharedKernel.Errors;

namespace ContractIQ.SharedKernel.Infrastructure.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!_validators.Any()) return await next();

        var context = new ValidationContext<TRequest>(request);
        var validationResults = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken)));
        var failures = validationResults.SelectMany(r => r.Errors).Where(f => f != null).ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Behaviors/LoggingBehavior.cs": """using MediatR;
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
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Behaviors/TransactionBehavior.cs": """using MediatR;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Behaviors;

public class TransactionBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly IUnitOfWork _unitOfWork;

    public TransactionBehavior(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next();
        if (request is ICommand)
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
        return response;
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Behaviors/AuthorizationBehavior.cs": """using MediatR;
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
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Telemetry/TelemetryExtensions.cs": """using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using OpenTelemetry.Metrics;

namespace ContractIQ.SharedKernel.Infrastructure.Telemetry;

public static class TelemetryExtensions
{
    public static IServiceCollection AddContractIQTelemetry(this IServiceCollection services, IConfiguration config)
    {
        var serviceName = config["ServiceName"] ?? "ContractIQ";

        services.AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(serviceName))
            .WithTracing(tracing => tracing
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddEntityFrameworkCoreInstrumentation()
                .AddSource("ContractIQ")
                .AddOtlpExporter(opt => opt.Endpoint = new Uri(config["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317")))
            .WithMetrics(metrics => metrics
                .AddAspNetCoreInstrumentation()
                .AddHttpClientInstrumentation()
                .AddRuntimeInstrumentation()
                .AddOtlpExporter(opt => opt.Endpoint = new Uri(config["OTEL_EXPORTER_OTLP_ENDPOINT"] ?? "http://localhost:4317")));

        return services;
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Middleware/TenantContextMiddleware.cs": """using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.SharedKernel.Infrastructure.Middleware;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var tenantClaim = context.User.FindFirst("tid")?.Value;
        if (string.IsNullOrEmpty(tenantClaim))
        {
            context.Response.StatusCode = 401;
            return;
        }

        await _next(context);
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/Middleware/CorrelationIdMiddleware.cs": """using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace ContractIQ.SharedKernel.Infrastructure.Middleware;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private const string CorrelationIdHeader = "X-Correlation-Id";

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue(CorrelationIdHeader, out var correlationId))
        {
            correlationId = Guid.NewGuid().ToString();
        }

        context.Items[CorrelationIdHeader] = correlationId;
        
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            context.Response.OnStarting(() =>
            {
                context.Response.Headers[CorrelationIdHeader] = correlationId;
                return Task.CompletedTask;
            });

            await _next(context);
        }
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/CurrentTenant/CurrentTenantService.cs": """using Microsoft.AspNetCore.Http;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Infrastructure.CurrentTenant;

public class CurrentTenantService : ICurrentTenant
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public TenantId Id
    {
        get
        {
            var tid = _httpContextAccessor.HttpContext?.User.FindFirst("tid")?.Value;
            return string.IsNullOrEmpty(tid) ? new TenantId(Guid.Empty) : TenantId.Parse(tid);
        }
    }

    public string Name => "Default";
}
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
