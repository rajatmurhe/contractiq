<ADR-009: AI Action Boundary — AI Proposes, Application Authorizes>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
AI agents, while powerful, are fundamentally untrustworthy for authorization decisions. A compromised prompt, a hallucinating model, or a prompt injection attack could cause unauthorized writes to enterprise systems (like SAP or Salesforce). The boundary between AI decisions and system execution must be enforced strictly in code, not by convention or assumed trust in the model.

## Decision
We will enforce a hard, 4-layer boundary for all AI-initiated actions:

1. **AI proposes:** The LangGraph integration node builds a proposed payload (e.g., SAP/Salesforce fields). This payload is a plain data structure (JSON) and is never executed directly.
2. **Application authorizes:** The Integrations service command handler verifies that the `WorkflowRun` is in an `Approved` state, the executing actor has `integrations:write` permission, and the idempotency key is fresh.
3. **Human approves when required:** If the contract `risk_level >= HIGH`, the workflow interrupts at an `approval_gate_node`. A human must explicitly approve, reject, or edit the proposed payload before the workflow resumes.
4. **Integration executes:** Only after layers 1-3 pass successfully does the adapter actually call the SAP or Salesforce API.

**Request Flow:**
`LangGraph Node (Propose Payload)` -> `Service Bus (IntegrationCommand)` -> `Integrations Service (Authorize & Check Approvals)` -> `SAP/Salesforce Adapter (Execute)`

## Alternatives Considered
- **Trust model output:** Rejected. Highly insecure. LLMs are susceptible to prompt injection and hallucinations.
- **Single authorization check:** Rejected. A single layer of defense is insufficient for enterprise integrations.
- **Allow model to call integration adapters directly (via tools):** Rejected. Violates the principle of least privilege and removes the application's ability to enforce business rules and human-in-the-loop approvals.

## Consequences
### Positive
- Strong defense-in-depth against prompt injection and malicious AI behavior.
- Clear separation of concerns: AI handles intelligence, application handles security.
- Auditability: Every integration execution is traceable to a specific approval.

### Negative
- Increased latency for integration actions due to multiple checks.
- More complex state management for interrupted workflows (human-in-the-loop).

### Neutral
- Forces all AI actions to be modeled as proposed data structures rather than direct RPC calls.

## Failure Modes and Mitigations
1. **Checkpoint replay attack:** An attacker intercepts a previously approved payload and replays it to trigger multiple writes. *Mitigation:* Require unique idempotency keys for every proposed action. The Integrations service tracks used keys and rejects duplicates.
2. **tenant_id injection via model output:** The AI model maliciously or accidentally changes the `tenant_id` in the proposed payload to affect another tenant. *Mitigation:* The Integrations service strictly ignores the `tenant_id` from the payload and derives it exclusively from the authenticated user's JWT or the trusted system context.
3. **Approval status check race condition:** An approval is revoked just milliseconds before the integration executes. *Mitigation:* Use optimistic concurrency control (e.g., ETag/RowVersion) on the `WorkflowRun` record. The authorization check validates the current version before executing.

## Implementation Notes
The integration command handler must perform strict validation before calling the adapter.

```csharp
public async Task Handle(ExecuteIntegrationCommand request, CancellationToken ct)
{
    // 1. Authorize actor
    _authz.RequirePermission(request.ActorId, "integrations:write");
    
    // 2. Validate tenant (never trust payload tenant)
    var currentTenant = _tenantContext.GetCurrentTenantId();
    if (request.Payload.TenantId != currentTenant) throw new UnauthorizedAccessException();

    // 3. Check Idempotency
    await _idempotencyService.EnsureUniqueAsync(request.IdempotencyKey, ct);

    // 4. Check Approval Status
    var run = await _dbContext.WorkflowRuns.FindAsync(request.WorkflowRunId);
    if (run.RiskLevel == RiskLevel.High && run.Status != WorkflowStatus.Approved) 
        throw new InvalidOperationException("High risk actions require explicit human approval.");

    // 5. Execute
    await _sapAdapter.ExecuteAsync(request.Payload, ct);
}
```
</ADR-009: AI Action Boundary — AI Proposes, Application Authorizes>
