using ContractIQ.Integrations.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace ContractIQ.Integrations.Infrastructure.Adapters;

public class MockSapAdapter(ILogger<MockSapAdapter> logger) : IContractSystemAdapter
{
    public Task<VendorProfile> GetVendorAsync(string vendorId, CancellationToken ct = default)
    {
        logger.LogInformation("Mock SAP: Fetching vendor {VendorId}", vendorId);
        return Task.FromResult(new VendorProfile(vendorId, "Acme Corp", "Active"));
    }

    public Task<PurchaseOrder> GetPurchaseOrderAsync(string poId, CancellationToken ct = default)
    {
        logger.LogInformation("Mock SAP: Fetching PO {PoId}", poId);
        return Task.FromResult(new PurchaseOrder(poId, "V-123", 50000m, "USD", "Approved"));
    }

    public Task<AdapterResult<string>> CreateContractAsync(CreateContractPayload payload, string idempotencyKey, CancellationToken ct = default)
    {
        logger.LogInformation("Mock SAP: Creating contract for {VendorId} [IdempotencyKey: {Key}]", payload.VendorId, idempotencyKey);
        var sapContractId = $"SAP-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        return Task.FromResult(new AdapterResult<string>(true, sapContractId, null, sapContractId));
    }

    public Task<AdapterResult<bool>> CompensateContractAsync(string externalId, CancellationToken ct = default)
    {
        logger.LogInformation("Mock SAP: Compensating (rolling back) contract {ExternalId}", externalId);
        return Task.FromResult(new AdapterResult<bool>(true, true, null, externalId));
    }
}

public class MockSalesforceAdapter(ILogger<MockSalesforceAdapter> logger) : ISalesforceAdapter
{
    public Task<SalesforceAccount> GetAccountAsync(string accountId, CancellationToken ct = default)
    {
        logger.LogInformation("Mock Salesforce: Fetching account {AccountId}", accountId);
        return Task.FromResult(new SalesforceAccount(accountId, "Acme Corp", "Enterprise"));
    }

    public Task<AdapterResult<string>> CreateOpportunityAsync(CreateOpportunityPayload payload, string idempotencyKey, CancellationToken ct = default)
    {
        logger.LogInformation("Mock Salesforce: Creating opportunity for {AccountId} [IdempotencyKey: {Key}]", payload.AccountId, idempotencyKey);
        // Simulate failure 10% of the time to test saga compensation
        if (Random.Shared.NextDouble() < 0.1)
        {
            logger.LogWarning("Mock Salesforce: Simulated random failure during opportunity creation");
            return Task.FromResult(new AdapterResult<string>(false, null, "SIMULATED_API_TIMEOUT", null));
        }

        var oppId = $"006{Guid.NewGuid().ToString("N")[..15]}";
        return Task.FromResult(new AdapterResult<string>(true, oppId, null, oppId));
    }

    public Task<AdapterResult<bool>> UpdateOpportunityAsync(string opportunityId, UpdateOpportunityPayload payload, CancellationToken ct = default)
    {
        logger.LogInformation("Mock Salesforce: Updating opportunity {OpportunityId}", opportunityId);
        return Task.FromResult(new AdapterResult<bool>(true, true, null, opportunityId));
    }
}
