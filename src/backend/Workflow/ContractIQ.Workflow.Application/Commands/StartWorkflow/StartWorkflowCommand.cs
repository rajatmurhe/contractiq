using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.StartWorkflow;

public record StartWorkflowCommand(TenantId TenantId, ContractId ContractId, string StartedBy)
    : IRequest<StartWorkflowResult>, ICommand;

public record StartWorkflowResult(WorkflowRunId RunId);
