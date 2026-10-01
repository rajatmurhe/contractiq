using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.ApproveWorkflow;

public sealed class ApproveWorkflowCommandHandler(IWorkflowRunRepository repository, IOutbox outbox)
    : IRequestHandler<ApproveWorkflowCommand, Unit>
{
    public async Task<Unit> Handle(ApproveWorkflowCommand command, CancellationToken ct)
    {
        var run = await repository.GetByIdAsync(command.RunId, command.TenantId, ct)
            ?? throw new InvalidOperationException($"WorkflowRun {command.RunId} not found");

        run.Approve(command.ApproverId, command.Decision);
        await repository.UpdateAsync(run, ct);
        return Unit.Value;
    }
}
