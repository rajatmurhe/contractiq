using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using ContractIQ.Workflow.Infrastructure.Persistence;
using ContractIQ.Workflow.Domain.Interfaces;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.Infrastructure.CurrentTenant;
using ContractIQ.SharedKernel.Infrastructure.Middleware;

var builder = WebApplication.CreateBuilder(args);

// JWT Bearer auth
var keycloakUrl = Environment.GetEnvironmentVariable("KEYCLOAK_URL") ?? "http://localhost:8080";
var keycloakRealm = Environment.GetEnvironmentVariable("KEYCLOAK_REALM") ?? "contractiq";
var authority = $"{keycloakUrl}/realms/{keycloakRealm}";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.RequireHttpsMetadata = false;
    });
builder.Services.AddAuthorization();

// MediatR
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(ContractIQ.Workflow.Application.Commands.StartWorkflow.StartWorkflowCommand).Assembly));

// DbContext
var connectionString = Environment.GetEnvironmentVariable("SQLSERVER_CONNECTION_STRING") ?? "Server=localhost;Database=WorkflowDb;User=sa;Password=Your_password123;TrustServerCertificate=True";
builder.Services.AddDbContext<WorkflowDbContext>(options => options.UseSqlServer(connectionString));

// Services
builder.Services.AddScoped<IWorkflowRunRepository, WorkflowRunRepository>();
builder.Services.AddScoped<ICurrentTenant, CurrentTenantService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<TenantContextMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");

app.MapControllers();

app.Run();
