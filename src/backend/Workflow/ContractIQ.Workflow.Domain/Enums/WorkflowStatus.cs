namespace ContractIQ.Workflow.Domain.Aggregates;

public enum WorkflowStatus
{
    Queued = 0,
    Running = 1,
    AwaitingApproval = 2,
    Resuming = 3,
    Completed = 4,
    Rejected = 5,
    Failed = 6
}
