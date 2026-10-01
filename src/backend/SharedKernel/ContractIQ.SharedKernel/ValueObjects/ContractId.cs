namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct ContractId(Guid Value)
{
    public static ContractId New() => new(Guid.NewGuid());
    public static ContractId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(ContractId id) => id.Value;
    public override string ToString() => Value.ToString();
}
