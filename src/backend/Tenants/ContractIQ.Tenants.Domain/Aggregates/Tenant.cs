using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Tenants.Domain.ValueObjects;

namespace ContractIQ.Tenants.Domain.Aggregates;

public class Tenant : AggregateRoot
{
    public TenantId Id { get; private set; } = TenantId.New();
    public string Name { get; private set; } = string.Empty;
    public TenantPlan Plan { get; private set; }
    public TenantSettings Settings { get; private set; } = TenantSettings.Default;
    public bool IsActive { get; private set; } = true;

    private Tenant() { }

    public static Tenant Create(string name, TenantPlan plan, TenantSettings settings, string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        var tenant = new Tenant { Name = name, Plan = plan, Settings = settings };
        tenant.SetCreated(tenant.Id, createdBy);
        return tenant;
    }

    public void UpdateSettings(TenantSettings settings, string updatedBy)
    {
        Settings = settings;
        SetUpdated(updatedBy);
    }

    public void Deactivate(string updatedBy) { IsActive = false; SetUpdated(updatedBy); }
    public void Activate(string updatedBy) { IsActive = true; SetUpdated(updatedBy); }
}
