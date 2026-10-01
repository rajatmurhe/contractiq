using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.ApproveWorkflow;

public record ApproveWorkflowCommand(
    TenantId TenantId,
    WorkflowRunId RunId,
    string ApproverId,
    string Decision,            // "Approved" | "EditAndApprove"
    object? EditedClauses = null
) : IRequest<Unit>, ICommand;
