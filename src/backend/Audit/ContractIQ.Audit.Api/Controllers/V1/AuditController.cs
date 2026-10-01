using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.Audit.Application.Queries.VerifyChain;
using ContractIQ.Audit.Application.Commands.RecordAuditEvent;

namespace ContractIQ.Audit.Api.Controllers.V1;

[ApiController]
[Route("api/v1/audit")]
[Authorize]
public class AuditController(ISender sender, ICurrentTenant currentTenant) : ControllerBase
{
    [HttpGet("verify")]
    public async Task<IActionResult> VerifyAuditChain(CancellationToken cancellationToken)
    {
        var query = new VerifyAuditChainQuery(currentTenant.Id);
        var result = await sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("events")]
    public async Task<IActionResult> RecordEvent([FromBody] RecordAuditEventRequest request, CancellationToken cancellationToken)
    {
        var command = new RecordAuditEventCommand(
            currentTenant.Id,
            request.EventType,
            request.ActorId,
            request.ResourceId,
            request.PayloadJson,
            request.ModelId,
            request.ModelVersion,
            request.PromptVersion,
            request.AgentVersion,
            request.WorkflowVersion,
            request.ChunkIds,
            request.ToolCalls,
            request.HumanApprover);
            
        var eventId = await sender.Send(command, cancellationToken);
        return Accepted(new { id = eventId });
    }
}

public record RecordAuditEventRequest(
    string EventType,
    string ActorId,
    string ResourceId,
    string PayloadJson,
    string? ModelId = null,
    string? ModelVersion = null,
    string? PromptVersion = null,
    string? AgentVersion = null,
    string? WorkflowVersion = null,
    string? ChunkIds = null,
    string? ToolCalls = null,
    string? HumanApprover = null);
