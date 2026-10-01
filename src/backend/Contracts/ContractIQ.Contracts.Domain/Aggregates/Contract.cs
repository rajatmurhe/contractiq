using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Entities;
using ContractIQ.Contracts.Domain.Enums;
using ContractIQ.Contracts.Domain.Events;
using ContractIQ.Contracts.Domain.ValueObjects;

namespace ContractIQ.Contracts.Domain.Aggregates;

public class Contract : AggregateRoot
{
    public ContractId Id { get; private set; }
    public new TenantId TenantId { get; private set; }
    public string Title { get; private set; }
    public ContractStatus Status { get; private set; }
    public string StoragePath { get; private set; }
    public string OriginalFileName { get; private set; }
    public long FileSizeBytes { get; private set; }
    public string ContentType { get; private set; }
    public ContractMetadata? Metadata { get; private set; }
    private readonly List<Clause> _clauses = new();
    public IReadOnlyList<Clause> Clauses => _clauses.AsReadOnly();
    public RiskReport? RiskReport { get; private set; }

    private Contract(TenantId tenantId, string title, string storagePath, string originalFileName, long fileSizeBytes, string contentType)
    {
        Id = ContractId.New();
        TenantId = tenantId;
        Title = title;
        StoragePath = storagePath;
        OriginalFileName = originalFileName;
        FileSizeBytes = fileSizeBytes;
        ContentType = contentType;
        Status = ContractStatus.Draft;
    }

    public static Contract Create(TenantId tenantId, string title, string storagePath, 
        string originalFileName, long fileSizeBytes, string contentType, string createdBy)
    {
        var contract = new Contract(tenantId, title, storagePath, originalFileName, fileSizeBytes, contentType);
        contract.SetCreated(tenantId, createdBy);
        contract.AddDomainEvent(new ContractUploaded(contract.Id, tenantId, title));
        return contract;
    }

    public void StartIngestion()
    {
        Status = ContractStatus.Processing;
        AddDomainEvent(new IngestionStarted(Id, TenantId));
    }

    public void CompleteIngestion(IEnumerable<Clause> clauses, RiskReport riskReport)
    {
        Status = ContractStatus.IngestionCompleted;
        _clauses.AddRange(clauses);
        RiskReport = riskReport;
        AddDomainEvent(new IngestionCompleted(Id, TenantId, riskReport.OverallRisk));
    }

    public void FailIngestion(string error)
    {
        Status = ContractStatus.Failed;
    }

    public void AddClause(Clause clause)
    {
        _clauses.Add(clause);
    }

    public void SetRiskReport(RiskReport report)
    {
        RiskReport = report;
    }
}
