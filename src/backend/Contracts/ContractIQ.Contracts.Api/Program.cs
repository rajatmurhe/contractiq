using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ContractIQ.Contracts.Application.Commands.UploadContract.UploadContractCommand).Assembly));
builder.Services.AddScoped<ContractIQ.SharedKernel.Interfaces.ICurrentTenant, DummyTenant>();

var app = builder.Build();

app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health/live", () => Results.Ok(new { status = "Healthy" }));
app.MapGet("/health/ready", () => Results.Ok(new { status = "Ready" }));

app.Run();



class DummyTenant : ContractIQ.SharedKernel.Interfaces.ICurrentTenant
{
    public ContractIQ.SharedKernel.ValueObjects.TenantId Id => ContractIQ.SharedKernel.ValueObjects.TenantId.New();
    public string Name => "Test Tenant";
}
