using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Aggregates;
using ContractIQ.Workflow.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.StartWorkflow;

public sealed class StartWorkflowCommandHandler(IWorkflowRunRepository repository, IOutbox outbox)
    : IRequestHandler<StartWorkflowCommand, StartWorkflowResult>
{
    public async Task<StartWorkflowResult> Handle(StartWorkflowCommand command, CancellationToken ct)
    {
        var sla = DateTimeOffset.UtcNow.AddHours(24); // default; overridden by tenant settings
        var run = WorkflowRun.Start(
            command.TenantId, command.ContractId,
            sla, workflowVersion: "1.0.0", command.StartedBy);

        await repository.AddAsync(run, ct);
        return new StartWorkflowResult(run.Id);
    }
}
