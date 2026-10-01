using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Domain;

public abstract class AuditableEntity
{
    public TenantId TenantId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? UpdatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public string? UpdatedBy { get; private set; }

    protected AuditableEntity() { }

    public void SetCreated(TenantId tenantId, string createdBy)
    {
        TenantId = tenantId;
        CreatedBy = createdBy;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public void SetUpdated(string updatedBy)
    {
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
