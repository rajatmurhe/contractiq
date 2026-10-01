using Microsoft.Extensions.DependencyInjection;
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
