> Archived prototype reference. Not the active runtime. Use the root README for the current product.

> **Hackathon review pilot:** A new evidence-first frontend and standalone FastAPI service are available. See [setup, deployment, limits, and demo script](../review-pilot.md). The new frontend requires the new review API; deploy them together. The architecture and screenshots below describe the earlier prototype, including mock integrations, and are not a claim that every listed capability is production-ready.

# ContractIQ — Multi-Tenant Agentic Contract Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![.NET 8](https://img.shields.io/badge/.NET-8.0-purple.svg)](https://dotnet.microsoft.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

> **Core Enterprise Guardrail**: *AI proposes → policy and rules validate → a human approves high-risk actions → the application executes controlled changes in SAP / Salesforce → everything is cryptographically auditable.*

---

## 🖼 Application Screenshots

### Executive Governance Dashboard
![Executive Governance Dashboard](../assets/screenshots/dashboard_overview.png)
*Real-time executive dashboard featuring KPI metrics, active tenant switcher, Recharts volume trend analytics, and portfolio risk breakdown.*

---

### Contract Ingestion & Risk Analytics
![Contract Ingestion & Risk Profile](../assets/screenshots/dashboard_charts.png)
*Interactive volume ingestion trend curve vs high-risk clause detection rate.*

---

### Multi-Tenant Contract Repository (Light & Dark Mode)

<div align="center">
  <img src="../assets/screenshots/contract_repository_grid.png" width="49%" alt="Contract Repository Light Mode" />
  <img src="../assets/screenshots/contract_repository_dark.png" width="49%" alt="Contract Repository Dark Mode" />
</div>

*Multi-tenant contract repository with real-time risk classification filters, counterparty metadata, and instant search.*

---

### Human-in-the-Loop Approval Inbox
![Human-in-the-Loop Inbox](../assets/screenshots/human_approvals_inbox.png)
*SLA countdown timers and policy validation gates requiring human authorization before SAP & Salesforce ERP execution.*

---

### Cryptographic Audit Chain Ledger & SQL Tamper Detector
![Cryptographic Audit Chain](../assets/screenshots/audit_chain_ledger.png)
*SHA-256 hash-chained event ledger visualizer with real-time SQL record tampering detection.*

---

### LangGraph Supervisor Agent Execution Trace
![LangGraph Agent Trace Graph](../assets/screenshots/agent_trace_graph.png)
*Real-time state execution pipeline across multi-agent nodes (`ingestion`, `extraction`, `risk`, `compliance`, `critic`, `approval_gate`, `integration`, `audit`).*

---

## 🏗 System Architecture

```
                       ┌────────────────────────┐
                       │  React 18 Frontend     │ (Port 3000)
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │   YARP API Gateway     │ (Port 5001)
                       └───────────┬────────────┘
                                   │
      ┌────────────────────────────┼────────────────────────────┐
      │                            │                            │
┌─────▼──────────┐         ┌───────▼────────┐          ┌────────▼───────┐
│ Contracts API  │         │  Workflow API  │          │   Audit API    │ (MediatR / EF Core)
└─────┬──────────┘         └───────┬────────┘          └────────┬───────┘
      │                            │                            │
┌─────▼──────────┐         ┌───────▼────────┐          ┌────────▼───────┐
│ Qdrant Vector  │         │ Python Agent   │          │ SHA-256 Ledger │
│ (Tenant-Bound) │         │ (LangGraph)    │          │ Hash-Chaining  │
└────────────────┘         └───────┬────────┘          └────────────────┘
                                   │
                           ┌───────▼────────┐
                           │ Integrations   │ ──► SAP OData Mock (:4004)
                           │ Adapter API    │ ──► Salesforce Mock (:9090)
                           └────────────────┘
```

---

## 🚀 Microservices & Tech Stack

| Component | Framework / Tech | Description |
|---|---|---|
| **Gateway** | ASP.NET Core / YARP | Security perimeter, JWT validation, rate limiting |
| **Contracts API** | .NET 8 / EF Core | Document ingestion, metadata tracking, Qdrant search |
| **Tenants API** | .NET 8 / EF Core | Tenant settings, risk threshold rules, SLA configuration |
| **Workflow API** | .NET 8 / MediatR | State machine, human approval triggers, SignalR hub |
| **Audit API** | .NET 8 / EF Core | SHA-256 hash-chain ledger, tamper-evident verification |
| **Integrations API** | .NET 8 / EF Core | Idempotent SAP OData & Salesforce REST adapters |
| **Agent Service** | Python 3.12 / LangGraph | Supervisor workflow, PII tagging, extraction & risk nodes |
| **MCP Server** | Python 3.12 / MCP SDK | Standardized AI agent tool interface with JWT authorization |
| **Frontend UI** | React 18 / Vite / Tailwind | Executive Dashboard, Repository, Copilot, Audit Ledger |

---

## ⚡ Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Linux / Windows)
- Git

### Running the Project

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rajatmurhe/contractiq.git
   cd contractiq
   ```

2. **Boot all 15 microservices**:
   ```bash
   cd infra/docker
   docker compose up -d --build
   ```

3. **Seed DB & Tenants** (creates tenants, users, and 40+ synthetic contracts):
   ```bash
   bash scripts/seed.sh
   ```

4. **Run End-to-End Demo** (verifies approval gates, SAP writes, and SQL tampering):
   ```bash
   bash scripts/demo.sh
   ```

5. **Open Frontend**:
   Navigate to **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛡 Security & Governance Features

- **SQL Row-Level Security (RLS)**: Enforced via `SESSION_CONTEXT(N'TenantId')` predicate filters.
- **Prompt Injection Defense**: Multi-tier regex + delimiter wrapping classifier blocks attack footnotes.
- **Cryptographic Audit Chain**: Every AI decision and ERP write is chained via `hash = SHA256(prev_hash + event_type + timestamp + payload)`.
- **Human-in-the-Loop Approval**: Contracts exceeding tenant risk threshold pause workflow execution until a human explicitly authorizes or edits the action.

---

## 📄 Architecture Decision Records (ADRs)

Detailed architectural choices are documented under `docs/adr/`:
- `ADR-001`: Microservices vs Modular Monolith
- `ADR-002`: LangGraph as Workflow Orchestrator
- `ADR-003`: AutoGen Scope — Negotiation Sub-team
- `ADR-004`: MCP vs REST Standards
- `ADR-005`: A2A Interoperability Scope
- `ADR-006`: SQL Server Row-Level Security
- `ADR-007`: Service Bus & Async Architecture
- `ADR-008`: Marketplace Architecture & Signed Packages
- `ADR-009`: AI Action Boundary — AI Proposes, Application Authorizes
- `ADR-010`: Tenant Isolation Across All Data Planes
- `ADR-011`: Saga Compensation for Partial Failures (SAP & Salesforce)
- `ADR-012`: Technology Justification Table

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
