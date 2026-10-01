import os

base_dir = "/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/backend"
os.chdir(base_dir)

files_to_delete = []
for root, dirs, files in os.walk("."):
    for file in files:
        if file in ["Class1.cs", "WeatherForecast.cs", "Controllers/WeatherForecastController.cs"]:
            files_to_delete.append(os.path.join(root, file))

for file in files_to_delete:
    try:
        os.remove(file)
    except:
        pass

files = {
    "Workflow/ContractIQ.Workflow.Domain/Workflow.cs": """namespace ContractIQ.Workflow.Domain;
public class Workflow { public Guid Id { get; set; } = Guid.NewGuid(); }
""",
    "Audit/ContractIQ.Audit.Domain/AuditLog.cs": """namespace ContractIQ.Audit.Domain;
public class AuditLog { public Guid Id { get; set; } = Guid.NewGuid(); }
""",
    "Integrations/ContractIQ.Integrations.Domain/Integration.cs": """namespace ContractIQ.Integrations.Domain;
public class Integration { public Guid Id { get; set; } = Guid.NewGuid(); }
""",
    "Tenants/ContractIQ.Tenants.Domain/Tenant.cs": """namespace ContractIQ.Tenants.Domain;
public class Tenant { public Guid Id { get; set; } = Guid.NewGuid(); }
""",
    "Gateway/Program.cs": """var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
app.MapGet("/", () => "API Gateway");
app.Run();
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

