<ADR-001: Microservices vs Modular Monolith>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ is a greenfield enterprise SaaS platform requiring multi-tenancy, real-time AI workflows, and compliance-grade audit trails. Our initial architecture needs to balance rapid development and developer experience (fast local dev) with the genuine operational realities of the system: AI workers have fundamentally different scaling profiles and runtime requirements (GPU affinity, Python ecosystem) compared to our read-heavy contract query workloads. 

## Decision
We will adopt a **Modular Monolith** architecture (.NET solution with strict, clean project boundaries) but selectively extract 7 independent processes from day one based on strict criteria (security perimeters, runtime incompatibility, scaling units, and deployment lifecycles).

The 7 extracted processes are:
1. **Gateway (YARP)** — The security perimeter and ingress controller.
2. **contracts-api** — Optimized for high upload throughput and parsing.
3. **workflow-api** — SignalR hub for real-time human-in-the-loop interactions.
4. **audit-api** — Separated due to strict compliance/data retention requirements.
5. **integrations-api** — Handles per-tenant credentials and external network egress (isolated blast radius).
6. **tenants-api** — Low-change bootstrap dependency; requires high availability.
7. **agent-service** (Python) — Fundamentally different runtime (Python 3.12, LangGraph), requires GPU affinity, and acts as a distinct scaling unit.

## Alternatives Considered
1. **True Microservices (Day One):** Extracting every domain into its own service. 
   - *Trade-off:* High cognitive load, complex local orchestration (requiring heavy Docker Compose/Kubernetes setups), and distributed transaction overhead. We rejected this because early-stage domain boundaries are often wrong.
2. **Single Pure Monolith:** Everything in one .NET process.
   - *Trade-off:* Simplest local dev experience, but physically impossible for the Python AI workloads. It would also force highly disparate scaling needs (like real-time SignalR vs heavy file uploads) onto the same hardware profile, leading to resource starvation.

## Consequences
### Positive
- Developer experience remains fast; the core domains can be referenced as local project dependencies rather than network calls.
- Refactoring boundaries is easy within the monolith using standard IDE refactoring tools.
- We still achieve independent scaling for the most critical bottlenecks (e.g., Python AI workers and API ingress).

### Negative
- Developers must be disciplined to avoid tight coupling between modules within the .NET monolith.
- Slightly more complex CI/CD pipeline, as we have to deploy both the monolith components and the 7 extracted services.

### Neutral
- Inter-process communication between the monolith and the extracted services requires messaging (RabbitMQ/Service Bus), mandating eventual consistency for those specific flows.

## Failure Modes and Mitigations
1. **Module Boundary Violations:** Developers bypassing internal API contracts and referencing EF Core DbContexts from other modules.
   - *Mitigation:* Use ArchUnitNET in CI to enforce that module A cannot reference module B's data layer, only its public interfaces or MediatR contracts.
2. **Shared Database Coupling:** A "god database" where the Python agent service directly queries the .NET monolith's operational tables, causing schema lock-in.
   - *Mitigation:* The Python service gets its own distinct database/schema (or vector store). Data synchronization happens purely through asynchronous events via RabbitMQ/Azure Service Bus.
3. **Over-Extraction (Resume-Driven Development):** The team starts splitting the remaining monolith prematurely before domain boundaries are proven.
   - *Mitigation:* Require a formal ADR for any new extracted service, requiring proof of distinct scaling, security, or runtime requirements.

## Implementation Notes
Within the .NET modular monolith, cross-module communication should use the Mediator pattern. 
```csharp
// Cross-module boundaries use strictly typed requests
public record ContractUploadedEvent(Guid ContractId, Guid TenantId) : INotification;

// Handled by the relevant module
internal class TriggerAIWorkflowHandler : INotificationHandler<ContractUploadedEvent>
{
    public async Task Handle(ContractUploadedEvent notification, CancellationToken ct)
    {
        // Publishes to RabbitMQ/Service Bus for the Python agent-service
        await _eventBus.PublishAsync(new ProcessContractCommand(notification.ContractId));
    }
}
```
Project references must explicitly disallow cross-domain `Data` project references. A `ContractIQ.Modules.Billing` project can reference `ContractIQ.Modules.Contracts.Contracts`, but NEVER `ContractIQ.Modules.Contracts.Infrastructure`.
</ADR-001: Microservices vs Modular Monolith>
