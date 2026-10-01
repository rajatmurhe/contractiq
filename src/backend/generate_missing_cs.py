#!/usr/bin/env python3
"""Generates all missing .cs source files for ContractIQ .NET backend."""

import os

ROOT = "/Users/rajatmurhe/.gemini/antigravity/scratch/contractiq/src/backend"

files = {}

# ─── Remove stale Class1.cs placeholders ─────────────────────────────────────
# We'll overwrite them by writing to the same paths.

# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

files["Workflow/ContractIQ.Workflow.Domain/Aggregates/WorkflowRun.cs"] = '''\
using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Workflow.Domain.Aggregates;

public class WorkflowRun : AggregateRoot
{
    public WorkflowRunId Id { get; private set; } = WorkflowRunId.New();
    public TenantId TenantId { get; private set; }
    public ContractId ContractId { get; private set; }
    public WorkflowStatus Status { get; private set; }
    public string? CheckpointId { get; private set; }
    public string? HumanDecision { get; private set; }
    public string? ApprovedBy { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public DateTimeOffset SlaDeadline { get; private set; }
    public string? FailureReason { get; private set; }
    public string WorkflowVersion { get; private set; } = string.Empty;

    private WorkflowRun() { }

    public static WorkflowRun Start(
        TenantId tenantId, ContractId contractId,
        DateTimeOffset slaDeadline, string workflowVersion, string startedBy)
    {
        var run = new WorkflowRun
        {
            TenantId = tenantId,
            ContractId = contractId,
            Status = WorkflowStatus.Queued,
            SlaDeadline = slaDeadline,
            WorkflowVersion = workflowVersion,
        };
        run.SetCreated(tenantId, startedBy);
        return run;
    }

    public void UpdateCheckpoint(string checkpointId)
    {
        CheckpointId = checkpointId;
        Status = WorkflowStatus.Running;
    }

    public void RequestApproval(string checkpointId)
    {
        CheckpointId = checkpointId;
        Status = WorkflowStatus.AwaitingApproval;
    }

    public void Approve(string approverId, string decision)
    {
        HumanDecision = decision;
        ApprovedBy = approverId;
        ApprovedAt = DateTimeOffset.UtcNow;
        Status = WorkflowStatus.Resuming;
    }

    public void Reject(string approverId, string reason)
    {
        ApprovedBy = approverId;
        HumanDecision = "Rejected";
        FailureReason = reason;
        Status = WorkflowStatus.Rejected;
    }

    public void Complete()
    {
        Status = WorkflowStatus.Completed;
    }

    public void Fail(string reason)
    {
        FailureReason = reason;
        Status = WorkflowStatus.Failed;
    }
}
'''

files["Workflow/ContractIQ.Workflow.Domain/Enums/WorkflowStatus.cs"] = '''\
namespace ContractIQ.Workflow.Domain.Aggregates;

public enum WorkflowStatus
{
    Queued = 0,
    Running = 1,
    AwaitingApproval = 2,
    Resuming = 3,
    Completed = 4,
    Rejected = 5,
    Failed = 6
}
'''

files["Workflow/ContractIQ.Workflow.Domain/Events/WorkflowStarted.cs"] = '''\
using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Workflow.Domain.Events;

public record WorkflowStarted(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId) : DomainEvent;
public record ApprovalRequired(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId, string CheckpointId) : DomainEvent;
public record WorkflowCompleted(WorkflowRunId RunId, TenantId TenantId, ContractId ContractId) : DomainEvent;
'''

files["Workflow/ContractIQ.Workflow.Domain/Interfaces/IWorkflowRunRepository.cs"] = '''\
using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Aggregates;

namespace ContractIQ.Workflow.Domain.Interfaces;

public interface IWorkflowRunRepository
{
    Task<WorkflowRun?> GetByIdAsync(WorkflowRunId id, TenantId tenantId, CancellationToken ct = default);
    Task<PaginatedResult<WorkflowRun>> ListPendingApprovalsAsync(TenantId tenantId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(WorkflowRun run, CancellationToken ct = default);
    Task UpdateAsync(WorkflowRun run, CancellationToken ct = default);
}
'''

files["Workflow/ContractIQ.Workflow.Domain/Class1.cs"] = '''\
// Placeholder removed — see domain files
'''

# ─── Workflow Application ─────────────────────────────────────────────────────

files["Workflow/ContractIQ.Workflow.Application/Commands/StartWorkflow/StartWorkflowCommand.cs"] = '''\
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.StartWorkflow;

public record StartWorkflowCommand(TenantId TenantId, ContractId ContractId, string StartedBy)
    : IRequest<StartWorkflowResult>, ICommand;

public record StartWorkflowResult(WorkflowRunId RunId);
'''

files["Workflow/ContractIQ.Workflow.Application/Commands/StartWorkflow/StartWorkflowCommandHandler.cs"] = '''\
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
'''

files["Workflow/ContractIQ.Workflow.Application/Commands/ApproveWorkflow/ApproveWorkflowCommand.cs"] = '''\
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.ApproveWorkflow;

public record ApproveWorkflowCommand(
    TenantId TenantId,
    WorkflowRunId RunId,
    string ApproverId,
    string Decision,            // "Approved" | "EditAndApprove"
    object? EditedClauses = null
) : IRequest<Unit>, ICommand;
'''

files["Workflow/ContractIQ.Workflow.Application/Commands/ApproveWorkflow/ApproveWorkflowCommandHandler.cs"] = '''\
using ContractIQ.SharedKernel.Interfaces;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Workflow.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Workflow.Application.Commands.ApproveWorkflow;

public sealed class ApproveWorkflowCommandHandler(IWorkflowRunRepository repository, IOutbox outbox)
    : IRequestHandler<ApproveWorkflowCommand, Unit>
{
    public async Task<Unit> Handle(ApproveWorkflowCommand command, CancellationToken ct)
    {
        var run = await repository.GetByIdAsync(command.RunId, command.TenantId, ct)
            ?? throw new InvalidOperationException($"WorkflowRun {command.RunId} not found");

        run.Approve(command.ApproverId, command.Decision);
        await repository.UpdateAsync(run, ct);
        return Unit.Value;
    }
}
'''

files["Workflow/ContractIQ.Workflow.Application/Class1.cs"] = '''\
// Placeholder removed
'''

files["Workflow/ContractIQ.Workflow.Infrastructure/Class1.cs"] = '''\
// Placeholder removed
'''

# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

files["Audit/ContractIQ.Audit.Domain/Entities/AuditEvent.cs"] = '''\
using System.Security.Cryptography;
using System.Text;
using ContractIQ.SharedKernel.ValueObjects;

namespace ContractIQ.Audit.Domain.Entities;

public class AuditEvent
{
    public AuditEventId Id { get; init; } = AuditEventId.New();
    public TenantId TenantId { get; init; }
    public required string EventType { get; init; }
    public required string ActorId { get; init; }
    public required string ResourceId { get; init; }
    public required string Payload { get; init; }
    public required string PreviousHash { get; init; }
    public required string Hash { get; init; }
    public DateTimeOffset OccurredAt { get; init; } = DateTimeOffset.UtcNow;

    // AI-specific fields — nullable; only set for AI-generated events
    public string? ModelId { get; init; }
    public string? ModelVersion { get; init; }
    public string? PromptVersion { get; init; }
    public string? AgentVersion { get; init; }
    public string? WorkflowVersion { get; init; }
    public string? ChunkIds { get; init; }        // JSON array
    public string? ToolCalls { get; init; }       // JSON
    public string? HumanApprover { get; init; }

    public static string ComputeHash(string previousHash, string eventType, DateTimeOffset occurredAt, string payload)
    {
        var input = $"{previousHash}|{eventType}|{occurredAt.Ticks}|{payload}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)));
    }
}
'''

files["Audit/ContractIQ.Audit.Domain/Interfaces/IAuditEventRepository.cs"] = '''\
using ContractIQ.SharedKernel.Models;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Audit.Domain.Entities;

namespace ContractIQ.Audit.Domain.Interfaces;

public interface IAuditEventRepository
{
    Task<AuditEvent?> GetLatestAsync(TenantId tenantId, CancellationToken ct = default);
    Task<PaginatedResult<AuditEvent>> ListAsync(TenantId tenantId, string? runId, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<AuditEvent>> GetAllOrderedAsync(TenantId tenantId, CancellationToken ct = default);
    Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default);
}
'''

files["Audit/ContractIQ.Audit.Domain/Class1.cs"] = '''\
// Placeholder removed
'''

# ─── Audit Application ────────────────────────────────────────────────────────

files["Audit/ContractIQ.Audit.Application/Commands/RecordAuditEvent/RecordAuditEventCommand.cs"] = '''\
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Audit.Application.Commands.RecordAuditEvent;

public record RecordAuditEventCommand(
    TenantId TenantId,
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
    string? HumanApprover = null
) : IRequest<Guid>;
'''

files["Audit/ContractIQ.Audit.Application/Commands/RecordAuditEvent/RecordAuditEventCommandHandler.cs"] = '''\
using ContractIQ.Audit.Domain.Entities;
using ContractIQ.Audit.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Audit.Application.Commands.RecordAuditEvent;

public sealed class RecordAuditEventCommandHandler(IAuditEventRepository repository)
    : IRequestHandler<RecordAuditEventCommand, Guid>
{
    public async Task<Guid> Handle(RecordAuditEventCommand cmd, CancellationToken ct)
    {
        var latest = await repository.GetLatestAsync(cmd.TenantId, ct);
        var previousHash = latest?.Hash ?? "GENESIS";
        var now = DateTimeOffset.UtcNow;
        var hash = AuditEvent.ComputeHash(previousHash, cmd.EventType, now, cmd.PayloadJson);

        var ev = new AuditEvent
        {
            TenantId = cmd.TenantId,
            EventType = cmd.EventType,
            ActorId = cmd.ActorId,
            ResourceId = cmd.ResourceId,
            Payload = cmd.PayloadJson,
            PreviousHash = previousHash,
            Hash = hash,
            OccurredAt = now,
            ModelId = cmd.ModelId,
            ModelVersion = cmd.ModelVersion,
            PromptVersion = cmd.PromptVersion,
            AgentVersion = cmd.AgentVersion,
            WorkflowVersion = cmd.WorkflowVersion,
            ChunkIds = cmd.ChunkIds,
            ToolCalls = cmd.ToolCalls,
            HumanApprover = cmd.HumanApprover,
        };

        await repository.AppendAsync(ev, ct);
        return ev.Id.Value;
    }
}
'''

files["Audit/ContractIQ.Audit.Application/Queries/VerifyChain/VerifyAuditChainQuery.cs"] = '''\
using ContractIQ.SharedKernel.ValueObjects;
using MediatR;

namespace ContractIQ.Audit.Application.Queries.VerifyChain;

public record VerifyAuditChainQuery(TenantId TenantId) : IRequest<VerifyAuditChainResult>;

public record VerifyAuditChainResult(bool Valid, Guid? BrokenAt);
'''

files["Audit/ContractIQ.Audit.Application/Queries/VerifyChain/VerifyAuditChainQueryHandler.cs"] = '''\
using ContractIQ.Audit.Domain.Entities;
using ContractIQ.Audit.Domain.Interfaces;
using MediatR;

namespace ContractIQ.Audit.Application.Queries.VerifyChain;

public sealed class VerifyAuditChainQueryHandler(IAuditEventRepository repository)
    : IRequestHandler<VerifyAuditChainQuery, VerifyAuditChainResult>
{
    public async Task<VerifyAuditChainResult> Handle(VerifyAuditChainQuery query, CancellationToken ct)
    {
        var events = await repository.GetAllOrderedAsync(query.TenantId, ct);
        if (events.Count == 0) return new VerifyAuditChainResult(true, null);

        var previousHash = "GENESIS";
        foreach (var ev in events)
        {
            var expected = AuditEvent.ComputeHash(previousHash, ev.EventType, ev.OccurredAt, ev.Payload);
            if (!string.Equals(expected, ev.Hash, StringComparison.OrdinalIgnoreCase))
                return new VerifyAuditChainResult(false, ev.Id.Value);
            previousHash = ev.Hash;
        }
        return new VerifyAuditChainResult(true, null);
    }
}
'''

files["Audit/ContractIQ.Audit.Application/Class1.cs"] = '''\
// Placeholder removed
'''

files["Audit/ContractIQ.Audit.Infrastructure/Class1.cs"] = '''\
// Placeholder removed
'''

# ═══════════════════════════════════════════════════════════════════════════════
# TENANTS DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

files["Tenants/ContractIQ.Tenants.Domain/Aggregates/Tenant.cs"] = '''\
using ContractIQ.SharedKernel.Domain;
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Tenants.Domain.ValueObjects;

namespace ContractIQ.Tenants.Domain.Aggregates;

public class Tenant : AggregateRoot
{
    public TenantId Id { get; private set; } = TenantId.New();
    public string Name { get; private set; } = string.Empty;
    public TenantPlan Plan { get; private set; }
    public TenantSettings Settings { get; private set; } = TenantSettings.Default;
    public bool IsActive { get; private set; } = true;

    private Tenant() { }

    public static Tenant Create(string name, TenantPlan plan, TenantSettings settings, string createdBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        var tenant = new Tenant { Name = name, Plan = plan, Settings = settings };
        tenant.SetCreated(tenant.Id, createdBy);
        return tenant;
    }

    public void UpdateSettings(TenantSettings settings, string updatedBy)
    {
        Settings = settings;
        SetUpdated(updatedBy);
    }

    public void Deactivate(string updatedBy) { IsActive = false; SetUpdated(updatedBy); }
    public void Activate(string updatedBy) { IsActive = true; SetUpdated(updatedBy); }
}
'''

files["Tenants/ContractIQ.Tenants.Domain/Aggregates/TenantPlan.cs"] = '''\
namespace ContractIQ.Tenants.Domain.Aggregates;

public enum TenantPlan { Free = 0, Professional = 1, Enterprise = 2 }
'''

files["Tenants/ContractIQ.Tenants.Domain/ValueObjects/TenantSettings.cs"] = '''\
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
'''

files["Tenants/ContractIQ.Tenants.Domain/Interfaces/ITenantRepository.cs"] = '''\
using ContractIQ.SharedKernel.ValueObjects;
using ContractIQ.Tenants.Domain.Aggregates;

namespace ContractIQ.Tenants.Domain.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetByIdAsync(TenantId id, CancellationToken ct = default);
    Task<IReadOnlyList<Tenant>> ListAsync(CancellationToken ct = default);
    Task AddAsync(Tenant tenant, CancellationToken ct = default);
    Task UpdateAsync(Tenant tenant, CancellationToken ct = default);
}
'''

files["Tenants/ContractIQ.Tenants.Domain/Class1.cs"] = '''\
// Placeholder removed
'''

files["Tenants/ContractIQ.Tenants.Application/Class1.cs"] = '''\
// Placeholder removed
'''

files["Tenants/ContractIQ.Tenants.Infrastructure/Class1.cs"] = '''\
// Placeholder removed
'''

# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATIONS DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

files["Integrations/ContractIQ.Integrations.Domain/Interfaces/IContractSystemAdapter.cs"] = '''\
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
'''

files["Integrations/ContractIQ.Integrations.Domain/Entities/IdempotencyRecord.cs"] = '''\
namespace ContractIQ.Integrations.Domain.Entities;

public class IdempotencyRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ExternalCorrelationId { get; init; }   // {workflowRunId}:{step}
    public required string AdapterName { get; init; }
    public required string ResultJson { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
'''

files["Integrations/ContractIQ.Integrations.Domain/Sagas/CreateContractSagaState.cs"] = '''\
namespace ContractIQ.Integrations.Domain.Sagas;

public class CreateContractSagaState
{
    public Guid SagaId { get; init; } = Guid.NewGuid();
    public required string WorkflowRunId { get; init; }
    public SagaStep CurrentStep { get; set; } = SagaStep.SapCreateContract;
    public SagaStatus Status { get; set; } = SagaStatus.InProgress;
    public string? SapExternalId { get; set; }
    public string? SalesforceExternalId { get; set; }
    public string? FailureReason { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum SagaStep { SapCreateContract, SalesforceCreateOpportunity, Compensating, Done }
public enum SagaStatus { InProgress, Completed, CompensationRequired, Compensated, Failed }
'''

files["Integrations/ContractIQ.Integrations.Domain/Class1.cs"] = '''\
// Placeholder removed
'''

files["Integrations/ContractIQ.Integrations.Application/Class1.cs"] = '''\
// Placeholder removed
'''

files["Integrations/ContractIQ.Integrations.Infrastructure/Class1.cs"] = '''\
// Placeholder removed
'''

# ─── Write all files ─────────────────────────────────────────────────────────
created = 0
for rel_path, content in files.items():
    full_path = os.path.join(ROOT, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
    print(f"✅ {rel_path}")
    created += 1

print(f"\n✅ {created} files written.")
