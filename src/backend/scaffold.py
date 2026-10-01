import os
import subprocess

base_dir = "/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/backend"
os.makedirs(base_dir, exist_ok=True)
os.chdir(base_dir)

files = {
    "SharedKernel/ContractIQ.SharedKernel/ContractIQ.SharedKernel.csproj": """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="MediatR" Version="12.2.0" />
    <PackageReference Include="FluentValidation" Version="11.9.0" />
    <PackageReference Include="Serilog" Version="3.1.1" />
    <PackageReference Include="OpenTelemetry.Api" Version="1.7.0" />
  </ItemGroup>
</Project>""",

    "SharedKernel/ContractIQ.SharedKernel.Infrastructure/ContractIQ.SharedKernel.Infrastructure.csproj": """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../ContractIQ.SharedKernel/ContractIQ.SharedKernel.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.2" />
    <PackageReference Include="Serilog.Sinks.Console" Version="5.0.1" />
    <PackageReference Include="OpenTelemetry.Extensions.Hosting" Version="1.7.0" />
    <PackageReference Include="OpenTelemetry.Exporter.OpenTelemetryProtocol" Version="1.7.0" />
    <PackageReference Include="Polly" Version="8.3.0" />
    <PackageReference Include="Microsoft.AspNetCore.Http.Abstractions" Version="2.2.0" />
  </ItemGroup>
</Project>""",

    "Contracts/ContractIQ.Contracts.Domain/ContractIQ.Contracts.Domain.csproj": """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../../SharedKernel/ContractIQ.SharedKernel/ContractIQ.SharedKernel.csproj" />
  </ItemGroup>
</Project>""",

    "Contracts/ContractIQ.Contracts.Application/ContractIQ.Contracts.Application.csproj": """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../ContractIQ.Contracts.Domain/ContractIQ.Contracts.Domain.csproj" />
  </ItemGroup>
</Project>""",

    "Contracts/ContractIQ.Contracts.Infrastructure/ContractIQ.Contracts.Infrastructure.csproj": """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../ContractIQ.Contracts.Application/ContractIQ.Contracts.Application.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.2" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.2" />
  </ItemGroup>
</Project>""",

    "Contracts/ContractIQ.Contracts.Api/ContractIQ.Contracts.Api.csproj": """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../ContractIQ.Contracts.Infrastructure/ContractIQ.Contracts.Infrastructure.csproj" />
    <ProjectReference Include="../../SharedKernel/ContractIQ.SharedKernel.Infrastructure/ContractIQ.SharedKernel.Infrastructure.csproj" />
  </ItemGroup>
</Project>""",

    "Gateway/ContractIQ.Gateway.csproj": """<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Yarp.ReverseProxy" Version="2.1.0" />
  </ItemGroup>
</Project>""",

    "SharedKernel/ContractIQ.SharedKernel/ValueObjects/TenantId.cs": """namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct TenantId(Guid Value)
{
    public static TenantId New() => new(Guid.NewGuid());
    public static TenantId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(TenantId id) => id.Value;
    public override string ToString() => Value.ToString();
}
""",
    "SharedKernel/ContractIQ.SharedKernel/ValueObjects/ContractId.cs": """namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct ContractId(Guid Value)
{
    public static ContractId New() => new(Guid.NewGuid());
    public static ContractId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(ContractId id) => id.Value;
    public override string ToString() => Value.ToString();
}
""",
    "SharedKernel/ContractIQ.SharedKernel/ValueObjects/WorkflowRunId.cs": """namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct WorkflowRunId(Guid Value)
{
    public static WorkflowRunId New() => new(Guid.NewGuid());
    public static WorkflowRunId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(WorkflowRunId id) => id.Value;
    public override string ToString() => Value.ToString();
}
""",
    "SharedKernel/ContractIQ.SharedKernel/ValueObjects/AuditEventId.cs": """namespace ContractIQ.SharedKernel.ValueObjects;

public readonly record struct AuditEventId(Guid Value)
{
    public static AuditEventId New() => new(Guid.NewGuid());
    public static AuditEventId Parse(string s) => new(Guid.Parse(s));
    public static implicit operator Guid(AuditEventId id) => id.Value;
    public override string ToString() => Value.ToString();
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Domain/AuditableEntity.cs": """using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Domain;

public abstract class AuditableEntity
{
    public TenantId TenantId { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? UpdatedAt { get; private set; }
    public string CreatedBy { get; private set; } = string.Empty;
    public string? UpdatedBy { get; private set; }

    protected AuditableEntity() { }

    public void SetCreated(TenantId tenantId, string createdBy)
    {
        TenantId = tenantId;
        CreatedBy = createdBy;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public void SetUpdated(string updatedBy)
    {
        UpdatedBy = updatedBy;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Domain/DomainEvent.cs": """namespace ContractIQ.SharedKernel.Domain;

public abstract record DomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Domain/AggregateRoot.cs": """namespace ContractIQ.SharedKernel.Domain;

public abstract class AggregateRoot : AuditableEntity
{
    private readonly List<DomainEvent> _domainEvents = new();

    public void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public IReadOnlyList<DomainEvent> PopDomainEvents()
    {
        var copy = _domainEvents.ToList();
        _domainEvents.Clear();
        return copy;
    }
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/ICurrentTenant.cs": """using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Interfaces;

public interface ICurrentTenant
{
    TenantId Id { get; }
    string Name { get; }
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/IUnitOfWork.cs": """namespace ContractIQ.SharedKernel.Interfaces;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/IOutbox.cs": """using ContractIQ.SharedKernel.Domain;

namespace ContractIQ.SharedKernel.Interfaces;

public interface IOutbox
{
    Task PublishAsync<T>(T message, CancellationToken cancellationToken = default) where T : DomainEvent;
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/IBlobStore.cs": """namespace ContractIQ.SharedKernel.Interfaces;

public interface IBlobStore
{
    Task<Uri> UploadAsync(string containerName, string blobPath, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string containerName, string blobPath, CancellationToken cancellationToken = default);
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Interfaces/IAuditClient.cs": """using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Interfaces;

public interface IAuditClient
{
    Task RecordAsync(AuditEventRequest request, CancellationToken cancellationToken = default);
}

public record AuditEventRequest(
    TenantId TenantId,
    string EventType,
    string ActorId,
    string ResourceId,
    object Payload,
    string? ModelId = null,
    string? ModelVersion = null,
    string? PromptVersion = null,
    string? AgentVersion = null,
    string? WorkflowVersion = null,
    string[]? ChunkIds = null,
    object? ToolCalls = null,
    string? HumanApprover = null
);
""",
    "SharedKernel/ContractIQ.SharedKernel/Messaging/OutboxMessage.cs": """using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.SharedKernel.Messaging;

public class OutboxMessage
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string EventType { get; init; }
    public required string Payload { get; init; }
    public required TenantId TenantId { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; private set; }
    public int RetryCount { get; private set; }
    public string? Error { get; private set; }

    public void MarkProcessed() => ProcessedAt = DateTimeOffset.UtcNow;
    public void MarkFailed(string error) { Error = error; RetryCount++; }
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Models/PaginatedResult.cs": """namespace ContractIQ.SharedKernel.Models;

public record PaginatedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
""",
    "SharedKernel/ContractIQ.SharedKernel/Errors/DomainException.cs": """namespace ContractIQ.SharedKernel.Errors;

public class DomainException : Exception
{
    public string Code { get; }
    public DomainException(string code, string message) : base(message) => Code = code;
}
""",
    "Contracts/ContractIQ.Contracts.Domain/Aggregates/Contract.cs": """using ContractIQ.SharedKernel.Domain;
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
""",
    "Contracts/ContractIQ.Contracts.Domain/Aggregates/ContractStatus.cs": """namespace ContractIQ.Contracts.Domain.Aggregates;
public enum ContractStatus { Draft, Processing, IngestionCompleted, AwaitingApproval, Approved, Rejected, Failed }
""",
    "Contracts/ContractIQ.Contracts.Domain/Entities/Entity.cs": """namespace ContractIQ.Contracts.Domain.Entities;
public abstract class Entity { public Guid Id { get; protected set; } = Guid.NewGuid(); }
""",
    "Contracts/ContractIQ.Contracts.Domain/Entities/Clause.cs": """using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;
using ContractIQ.Contracts.Domain.ValueObjects;

namespace ContractIQ.Contracts.Domain.Entities;

public class Clause : Entity
{
    public ContractId ContractId { get; private set; }
    public ClauseType Type { get; private set; }
    public string Text { get; private set; } = string.Empty;
    public SourceSpan SourceSpan { get; private set; }
    public decimal Confidence { get; private set; }
    public string ExtractedByVersion { get; private set; } = string.Empty;
    public bool CriticVerified { get; private set; }

    public void MarkCriticVerified() => CriticVerified = true;
    public void MarkCriticUnverified() => CriticVerified = false;
}
""",
    "Contracts/ContractIQ.Contracts.Domain/Entities/RiskReport.cs": """using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;
using ContractIQ.Contracts.Domain.ValueObjects;

namespace ContractIQ.Contracts.Domain.Entities;

public class RiskReport : Entity
{
    public ContractId ContractId { get; private set; }
    public RiskLevel OverallRisk { get; private set; }
    public IReadOnlyList<RiskFinding> Findings { get; private set; } = new List<RiskFinding>();
    public string AgentVersion { get; private set; } = string.Empty;
    public string ModelId { get; private set; } = string.Empty;
    public string PromptVersion { get; private set; } = string.Empty;

    public static RiskReport Create(ContractId contractId, RiskLevel riskLevel, IEnumerable<RiskFinding> findings, string agentVersion, string modelId, string promptVersion)
    {
        return new RiskReport
        {
            ContractId = contractId,
            OverallRisk = riskLevel,
            Findings = findings.ToList(),
            AgentVersion = agentVersion,
            ModelId = modelId,
            PromptVersion = promptVersion
        };
    }
}
""",
    "Contracts/ContractIQ.Contracts.Domain/ValueObjects/SourceSpan.cs": """namespace ContractIQ.Contracts.Domain.ValueObjects;

public readonly record struct SourceSpan(int Page, int StartChar, int EndChar, string? SectionId = null)
{
    public bool Contains(int charOffset) => charOffset >= StartChar && charOffset <= EndChar;
}
""",
    "Contracts/ContractIQ.Contracts.Domain/ValueObjects/RiskFinding.cs": """using ContractIQ.Contracts.Domain.Enums;

namespace ContractIQ.Contracts.Domain.ValueObjects;

public readonly record struct RiskFinding(
    string Description,
    RiskLevel Severity,
    SourceSpan Citation,
    string ChunkId,
    ClauseType RelatedClauseType
);
""",
    "Contracts/ContractIQ.Contracts.Domain/ValueObjects/ContractMetadata.cs": """namespace ContractIQ.Contracts.Domain.ValueObjects;

public record ContractMetadata(
    string? ContractType,
    string? CounterpartyName,
    DateTimeOffset? EffectiveDate,
    DateTimeOffset? ExpiryDate,
    string? Jurisdiction,
    string? Currency,
    decimal? TotalValue
);
""",
    "Contracts/ContractIQ.Contracts.Domain/Enums/ClauseType.cs": """namespace ContractIQ.Contracts.Domain.Enums;
public enum ClauseType { Indemnification, Liability, Termination, RenewalAutoRenewal, PaymentTerms, Confidentiality, DataProtection, IntellectualProperty, GoverningLaw, DisputeResolution, ForceMajeure, ChangeOfControl, Assignment, Warranty, Representation, SLA, Penalty, Other }
""",
    "Contracts/ContractIQ.Contracts.Domain/Enums/RiskLevel.cs": """namespace ContractIQ.Contracts.Domain.Enums;
public enum RiskLevel { Low = 1, Medium = 2, High = 3, Critical = 4 }
""",
    "Contracts/ContractIQ.Contracts.Domain/Events/ContractUploaded.cs": """using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Contracts.Domain.Events;
public record ContractUploaded(ContractId ContractId, TenantId TenantId, string Title) : DomainEvent;
""",
    "Contracts/ContractIQ.Contracts.Domain/Events/IngestionStarted.cs": """using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Contracts.Domain.Events;
public record IngestionStarted(ContractId ContractId, TenantId TenantId) : DomainEvent;
""",
    "Contracts/ContractIQ.Contracts.Domain/Events/IngestionCompleted.cs": """using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Contracts.Domain.Enums;

namespace ContractIQ.Contracts.Domain.Events;
public record IngestionCompleted(ContractId ContractId, TenantId TenantId, RiskLevel RiskLevel) : DomainEvent;
"""
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
