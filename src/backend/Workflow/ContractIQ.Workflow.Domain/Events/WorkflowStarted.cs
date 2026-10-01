using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Workflow.Domain.Events;

public record WorkflowStarted(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId) : DomainEvent;
public record ApprovalRequired(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId, string CheckpointId) : DomainEvent;
public record WorkflowCompleted(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId) : DomainEvent;
