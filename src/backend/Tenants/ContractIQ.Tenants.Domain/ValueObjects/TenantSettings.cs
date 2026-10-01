namespace ContractIQ.Tenants.Domain.ValueObjects;

public record TenantSettings(
    string PlaybookId,
    string PreferredModelId,
    int TokenBudgetPerRun,
    decimal RiskApprovalThreshold,
    int ApprovalSlaHours,
    bool EnablePiiRedaction,
    bool EnableInjectionClassifier,
    Dictionary<string, string> CustomMetadata)
{
    public static TenantSettings Default => new(
        PlaybookId: "default",
        PreferredModelId: "gpt-4o",
        TokenBudgetPerRun: 100_000,
        RiskApprovalThreshold: 2,
        ApprovalSlaHours: 24,
        EnablePiiRedaction: true,
        EnableInjectionClassifier: true,
        CustomMetadata: []);
}
