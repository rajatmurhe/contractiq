namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct AuditEventId(Guid Value)
{
    public static AuditEventId New() => new(Guid.NewGuid());
    public static AuditEventId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(AuditEventId id) => id.Value;
    public override string ToString() => Value.ToString();
}
