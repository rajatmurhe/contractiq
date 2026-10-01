using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Workflow.Domain.Aggregates;

public class WorkflowRun : AggregateRoot
{
    public WorkflowRunId Id { get; private set; } = WorkflowRunId.New();
    public new TenantId TenantId { get; private set; }
    public ContractId ContractId { get; private set; }
    public WorkflowStatus Status { get; private set; }
    public string? CheckpointId { get; private set; }
    public string? HumanDecision { get; private set; }
    public string? ApprovedBy { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public DateTimeOffset SlaDeadline { get; private set; }
    public string? FailureReason { get; private set; }
    public string WorkflowVersion { get; private set; } = string.Empty;

    private WorkflowRun() { }

    public static WorkflowRun Start(
        TenantId tenantId, ContractId contractId,
        DateTimeOffset slaDeadline, string workflowVersion, string startedBy)
    {
        var run = new WorkflowRun
        {
            TenantId = tenantId,
            ContractId = contractId,
            Status = WorkflowStatus.Queued,
            SlaDeadline = slaDeadline,
            WorkflowVersion = workflowVersion,
        };
        run.SetCreated(tenantId, startedBy);
        return run;
    }

    public void UpdateCheckpoint(string checkpointId)
    {
        CheckpointId = checkpointId;
        Status = WorkflowStatus.Running;
    }

    public void RequestApproval(string checkpointId)
    {
        CheckpointId = checkpointId;
        Status = WorkflowStatus.AwaitingApproval;
    }

    public void Approve(string approverId, string decision)
    {
        HumanDecision = decision;
        ApprovedBy = approverId;
        ApprovedAt = DateTimeOffset.UtcNow;
        Status = WorkflowStatus.Resuming;
    }

    public void Reject(string approverId, string reason)
    {
        ApprovedBy = approverId;
        HumanDecision = "Rejected";
        FailureReason = reason;
        Status = WorkflowStatus.Rejected;
    }

    public void Complete()
    {
        Status = WorkflowStatus.Completed;
    }

    public void Fail(string reason)
    {
        FailureReason = reason;
        Status = WorkflowStatus.Failed;
    }
}
