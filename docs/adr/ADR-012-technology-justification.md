<ADR-012: Technology Justification Table>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ relies on a complex stack of modern technologies to deliver multi-tenant agentic workflows. To ensure architectural consistency and prevent "resume-driven development", every technology choice must be explicitly justified against simpler alternatives, with clear trade-offs documented.

## Decision
We formally adopt the following technologies for the specified use cases.

| Technology | Problem it solves | Simpler alternative rejected | Reason for rejection | Key trade-off accepted |
|---|---|---|---|---|
| **LangGraph** | Orchestrating complex, stateful, cyclic AI workflows. | Simple LangChain chains or raw Python scripts. | Cannot reliably handle cycles (human-in-the-loop, retry loops) or state persistence. | Steep learning curve; ties core logic to a specific framework. |
| **AutoGen** | Multi-agent negotiation (Group Chat). | LangGraph multi-agent implementation. | AutoGen provides better out-of-the-box conversational patterns for multi-agent negotiation. | Integration overhead between LangGraph (workflow) and AutoGen (negotiation). |
| **MCP (Model Context Protocol)** | Standardizing tool interfaces for AI agents. | Custom HTTP/JSON tool definitions. | Requires writing custom parsing and validation for every LLM provider. | Bleeding-edge standard; tooling ecosystem is still maturing. |
| **A2A** | External agent interoperability. | Standard API webhooks. | Webhooks lack semantic understanding and standardized negotiation protocols. | Early stage standard; limited vendor support. |
| **Service Bus (Azure/RabbitMQ)** | Async messaging and decoupling. | Direct HTTP calls or Redis Pub/Sub. | HTTP lacks durability/retries; Redis lacks guaranteed delivery and DLQs. | Operational overhead of managing a broker. |
| **Redis** | Distributed caching and rate limiting. | In-memory `MemoryCache`. | State is lost on pod restart; cannot rate-limit across multiple instances. | Additional infrastructure dependency. |
| **SQL Server RLS** | Row-level security for tenant isolation. | Application-level `WHERE` clauses. | High risk of developer error causing cross-tenant data leakage. | Performance overhead on queries; harder to debug. |
| **Azure Blob / Azurite** | Unstructured document storage. | Storing files in SQL Server (VARBINARY). | Expensive, bloats database size, terrible performance for large files. | Eventual consistency between metadata (SQL) and files (Blob). |
| **Qdrant** | Vector search for RAG. | pgvector or SQL Server vector support. | SQL Server vector support is nascent; Qdrant offers better performance and metadata filtering. | Requires maintaining a separate database engine. |
| **APIM / YARP** | API Gateway and routing. | Direct exposure of internal microservices. | Security risks, lack of centralized rate limiting, routing, and auth termination. | Adds a network hop and latency. |
| **Azure Functions** | Serverless compute for cron jobs (renewals). | Background worker services (IHostedService). | Hosted services consume resources constantly; Functions scale to zero. | Vendor lock-in to Azure serverless. |
| **Logic Apps** | Workflow automation (Teams integration). | Custom .NET code hitting Teams Graph API. | Writing custom Graph API integration is slow and fragile; Logic Apps has native connectors. | Less testable; logic hidden in Azure portal. |
| **Marketplace** | Distributing standard contract workflows. | Manual database seeding or GitOps. | Hard to monetize or distribute to specific enterprise tenants dynamically. | Complex to build a secure, signed distribution mechanism. |
| **Outbox pattern** | Reliable event publishing tied to DB commits. | Publishing directly to Service Bus from code. | Risk of dual-write failure (DB commits, but Service Bus publish fails). | Adds latency and requires background processing infra. |
| **Pact** | Consumer-driven contract testing. | Traditional E2E integration tests. | E2E tests are slow, flaky, and require complex environments. | Requires coordination between frontend and backend teams. |

## Overall Technology Philosophy
Our philosophy is **"Boring Infrastructure, Innovative Application"**. We choose established, enterprise-grade tools (SQL Server, Azure Service Bus, Redis) for data and messaging to guarantee reliability and security. We reserve our complexity budget for the application layer (LangGraph, AutoGen, MCP) where we are building novel AI capabilities. Security (tenant isolation, AI action boundaries) is enforced structurally by the platform, never optionally by the developer.

## Alternatives Considered
(Covered inline within the table for each technology).

## Consequences
### Positive
- Clear rationale for the stack prevents technology sprawl.
- New engineers have a reference point for *why* a tool is used.
- Enforces the distinction between stable data tier and experimental AI tier.

### Negative
- Managing multiple databases (SQL, Redis, Qdrant) requires significant DevOps effort.

## Failure Modes and Mitigations
1. **Resume-driven development:** Developers push to introduce new tools (e.g., Kafka) without justification. *Mitigation:* New technologies require an ADR explicitly rejecting simpler alternatives before adoption.
2. **Framework lock-in (LangGraph):** The AI framework landscape changes rapidly; LangGraph might become obsolete. *Mitigation:* Wrap core AI logic in internal abstractions where possible, and ensure the API/Service Bus boundary remains agnostic to the Python AI implementation.
3. **Local development friction:** Running SQL, Redis, RabbitMQ, Qdrant, and Blob storage locally is heavy. *Mitigation:* Maintain a robust Docker Compose setup for local development that spins up all dependencies seamlessly.
</ADR-012: Technology Justification Table>
