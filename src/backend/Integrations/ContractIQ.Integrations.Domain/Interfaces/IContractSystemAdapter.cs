namespace ContractIQ.Integrations.Domain.Interfaces;

public interface IContractSystemAdapter
{
    Task<VendorProfile> GetVendorAsync(string vendorId, CancellationToken ct = default);
    Task<PurchaseOrder> GetPurchaseOrderAsync(string poId, CancellationToken ct = default);
    Task<AdapterResult<string>> CreateContractAsync(CreateContractPayload payload, string idempotencyKey, CancellationToken ct = default);
    Task<AdapterResult<bool>> CompensateContractAsync(string externalId, CancellationToken ct = default);
}

public interface ISalesforceAdapter
{
    Task<SalesforceAccount> GetAccountAsync(string accountId, CancellationToken ct = default);
    Task<AdapterResult<string>> CreateOpportunityAsync(CreateOpportunityPayload payload, string idempotencyKey, CancellationToken ct = default);
    Task<AdapterResult<bool>> UpdateOpportunityAsync(string opportunityId, UpdateOpportunityPayload payload, CancellationToken ct = default);
}

public record AdapterResult<T>(bool Success, T? Value, string? Error, string? ExternalId);
public record VendorProfile(string VendorId, string Name, string Status);
public record PurchaseOrder(string PoId, string VendorId, decimal NetAmount, string Currency, string Status);
public record SalesforceAccount(string AccountId, string Name, string Type);
public record CreateContractPayload(string VendorId, string Title, decimal Value, string Currency);
public record CreateOpportunityPayload(string AccountId, string ContractId, decimal Value, string Currency, string StageName);
public record UpdateOpportunityPayload(string StageName, decimal? Value);
