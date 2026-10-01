namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct WorkflowRunId(Guid Value)
{
    public static WorkflowRunId New() => new(Guid.NewGuid());
    public static WorkflowRunId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(WorkflowRunId id) => id.Value;
    public override string ToString() => Value.ToString();
}
