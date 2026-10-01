using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Application.Commands.UploadContract;
using ContractIQ.Contracts.Application.Queries.GetContract;

namespace ContractIQ.Contracts.Api.Controllers.V1;

[ApiController]
[Route("api/v1/contracts")]
[Authorize]
public class ContractsController(ISender sender, ICurrentTenant currentTenant) : ControllerBase
{
    [HttpPost("upload")]
    [RequestSizeLimit(52428800)] // 50MB
    public async Task<IActionResult> UploadContract([FromForm] UploadContractRequest request, CancellationToken cancellationToken)
    {
        if (request.File == null || request.File.Length == 0)
        {
            return BadRequest("File is required");
        }

        using var stream = request.File.OpenReadStream();
        var command = new UploadContractCommand(
            currentTenant.Id,
            request.Title ?? request.File.FileName,
            stream,
            request.File.FileName,
            request.File.Length,
            request.File.ContentType ?? "application/pdf",
            currentTenant.Name);

        var result = await sender.Send(command, cancellationToken);
        return Accepted(new { contractId = result.ContractId.Value, storagePath = result.StoragePath });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetContract(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetContractQuery(new ContractId(id), currentTenant.Id);
        var result = await sender.Send(query, cancellationToken);
        if (result == null) return NotFound();

        return Ok(result);
    }
}

public class UploadContractRequest
{
    public string? Title { get; set; }
    public IFormFile? File { get; set; }
}
