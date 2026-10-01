using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ContractIQ.SharedKernel.Interfaces;

namespace ContractIQ.Tenants.Api.Controllers.V1;

[ApiController]
[Route("api/v1/tenants")]
[Authorize]
public class TenantsController(ICurrentTenant currentTenant) : ControllerBase
{
    [HttpGet("current")]
    public IActionResult GetCurrentTenant()
    {
        return Ok(new
        {
            id = currentTenant.Id.Value,
            name = currentTenant.Name
        });
    }
}
