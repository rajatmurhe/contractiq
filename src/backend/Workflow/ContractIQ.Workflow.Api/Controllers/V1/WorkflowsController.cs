using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Application.Commands.StartWorkflow;
using ContractIQ.Workflow.Application.Commands.ApproveWorkflow;

namespace ContractIQ.Workflow.Api.Controllers.V1;

[ApiController]
[Route("api/v1/workflows")]
[Authorize]
public class WorkflowsController(ISender sender, ICurrentTenant currentTenant) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> StartWorkflow([FromBody] StartWorkflowRequest request, CancellationToken cancellationToken)
    {
        var command = new StartWorkflowCommand(
            currentTenant.Id,
            new ContractId(request.ContractId),
            request.StartedBy);
            
        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{runId}/approve")]
    public async Task<IActionResult> ApproveWorkflow(Guid runId, [FromBody] ApproveWorkflowRequest request, CancellationToken cancellationToken)
    {
        var command = new ApproveWorkflowCommand(
            currentTenant.Id,
            new WorkflowRunId(runId),
            request.ApproverId,
            request.Decision,
            request.EditedClauses);
            
        await sender.Send(command, cancellationToken);
        return NoContent();
    }
}

public record StartWorkflowRequest(Guid ContractId, string StartedBy);
public record ApproveWorkflowRequest(string ApproverId, string Decision, object? EditedClauses = null);
