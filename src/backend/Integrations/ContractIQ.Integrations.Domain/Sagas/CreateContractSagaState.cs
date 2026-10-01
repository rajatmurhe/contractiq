namespace ContractIQ.Integrations.Domain.Sagas;

public class CreateContractSagaState
{
    public Guid SagaId { get; init; } = Guid.NewGuid();
    public required string WorkflowRunId { get; init; }
    public SagaStep CurrentStep { get; set; } = SagaStep.SapCreateContract;
    public SagaStatus Status { get; set; } = SagaStatus.InProgress;
    public string? SapExternalId { get; set; }
    public string? SalesforceExternalId { get; set; }
    public string? FailureReason { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum SagaStep { SapCreateContract, SalesforceCreateOpportunity, Compensating, Done }
public enum SagaStatus { InProgress, Completed, CompensationRequired, Compensated, Failed }
