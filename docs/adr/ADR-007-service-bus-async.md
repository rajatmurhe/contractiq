<ADR-007: Service Bus and Async Processing>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ processes large contract uploads (up to 50MB) and performs OCR and LLM analysis, which can take 30-120 seconds. If the HTTP upload request blocks synchronously, it will time out, resulting in poor user experience. Additionally, multiple tenants may upload simultaneously, necessitating the decoupling of ingestion throughput from HTTP requests. Integration writes to external systems like SAP and Salesforce are notoriously slow and subject to transient failures. We need guaranteed delivery and retry semantics for these critical operations.

## Decision
We will use RabbitMQ (for local development) and Azure Service Bus (in production) to handle asynchronous processing. This provides guaranteed at-least-once delivery, retry capabilities, and decouples slow operations from synchronous HTTP request/response cycles.

**Asynchronous operations:**
1. Contract upload → ingestion trigger (via Outbox pattern)
2. Ingestion completed → LangGraph workflow trigger
3. Human approval → workflow resume
4. Integration action commands (SAP/Salesforce writes)
5. Webhook delivery (outbound)

**Synchronous operations (and why they stay sync):**
1. Contract reads / list / search (User expects immediate UI updates for existing data)
2. Audit event queries (Read-heavy, fast indexing)
3. Tenant metadata reads (Fast, frequently cached)
4. Health probes (System status requires immediate accurate responses)

We will implement the **Outbox Pattern** to transition from sync to async safely: domain events are saved to an `OutboxMessage` table in the same transaction as the business entity changes. A background publisher reads from this table and sends to the message bus, ensuring at-least-once delivery. Consumers must implement idempotency.

## Alternatives Considered
- **Sync HTTP everywhere:** Rejected. Causes timeouts for OCR/LLM workloads and limits horizontal scalability during spikes.
- **gRPC streaming:** Rejected. Good for point-to-point but lacks durability, retry queues, and dead-lettering for failed jobs.
- **Kafka:** Rejected. Overkill for our current message volume; we need work queues rather than event streaming/replay.
- **Raw RabbitMQ without abstraction:** Rejected. Makes it difficult to swap to Azure Service Bus in production without changing application code.

## Consequences
### Positive
- HTTP endpoints remain fast and responsive.
- Spiky workloads do not overwhelm backend services; they act as a buffer.
- Transient integration failures can be retried automatically.

### Negative
- Increased architectural complexity.
- Requires managing an additional infrastructure component.
- Eventual consistency complicates UI state management (requires polling or SignalR/WebSockets).

### Neutral
- Forces all message consumers to be idempotent.

## Failure Modes and Mitigations
1. **Consumer lag:** Message queue builds up faster than processing. *Mitigation:* Set up auto-scaling rules based on queue depth.
2. **Dead letter accumulation:** Poison messages fail repeatedly. *Mitigation:* Implement strict retry limits (e.g., 3 retries) before moving to a Dead Letter Queue (DLQ), with alerting on DLQ depth.
3. **Poison messages crashing consumers:** A malformed message causes the consumer to throw an unhandled exception. *Mitigation:* Wrap consumer handlers in generic try-catch blocks that log the error and NACK the message to the DLQ instead of repeatedly crashing the worker.

## Implementation Notes
Use MassTransit to abstract the message broker. Configure the Entity Framework Core Outbox pattern.

```csharp
// MassTransit configuration
services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
    {
        o.UseSqlServer();
        o.UseBusOutbox();
    });

    x.UsingAzureServiceBus((context, cfg) =>
    {
        cfg.Host(configuration.GetConnectionString("ServiceBus"));
        cfg.ConfigureEndpoints(context);
    });
});
```
</ADR-007: Service Bus and Async Processing>
