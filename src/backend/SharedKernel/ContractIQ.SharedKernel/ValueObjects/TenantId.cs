namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct TenantId(Guid Value)
{
    public static TenantId New() => new(Guid.NewGuid());
    public static TenantId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(TenantId id) => id.Value;
    public override string ToString() => Value.ToString();
}
