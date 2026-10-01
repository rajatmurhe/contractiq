# ContractIQ Performance Specification

## Workload Assumption
- **Daily Volume**: 10,000 contracts/day
- **Peak Hour Volume**: 1,000/hour (~17/min)
- **Burst Multiplier**: 3× (~50/min)
- **Capacity Target**: 200/min (deliberate 4× headroom for resilience and future growth)

## SLA Targets
- **Upload API (Ingest)**: p95 < 5s (includes blob write, DB insert, Outbox publish)
- **Contract Reads**: p95 < 300ms
- **Semantic Search**: p95 < 500ms (Qdrant ANN)
- **Workflow Status**: p95 < 100ms (Redis cache)
- **Approval Inbox List**: p95 < 200ms

## k6 Scenarios
Defined in `tests/k6/golden-path.js`.

### 1. Ramp-up (Warmup)
- Duration: 2 mins
- Target: 20 VUs
- Validates system caches warming up, connection pools established, JIT compilation.

### 2. Steady State
- Duration: 10 mins
- Target: 50 VUs (simulating ~50 uploads/min + continuous reads)
- Validates sustained throughput, memory stability (no leaks), and message bus consumer lag.

### 3. Spike (Burst)
- Duration: 1 min
- Target: 200 VUs
- Validates resilience pipeline (Polly circuit breakers), rate limiting, and auto-scaling triggers (if enabled in Tier 2).

## Optimization Strategies

### Database (SQL Server)
- **Indexing**: 
  - `Contracts`: Index on `(TenantId, Status) INCLUDE (Title, RiskLevel, CreatedAt)` for the list view.
  - `OutboxMessages`: Filtered index on `(ProcessedAt) WHERE ProcessedAt IS NULL` for the publisher background service.
- **Query Plans**: Utilize `AsNoTracking()` for all read-only queries in EF Core to reduce memory overhead and CPU.

### Caching (Redis)
- **Tenant Settings**: Cached for 1 hour (`ttl: 3600s`). Invalidated strictly on update.
- **Workflow Status**: Cached for 30s. Fetched by the UI polling fallback (when SignalR is unavailable).
- **Playbooks**: Cached for 12 hours. High read-to-write ratio during Risk Agent evaluation.

### Vector Search (Qdrant)
- **HNSW Parameters**: `m: 16`, `ef_construct: 100`. (Optimized for fast indexing while maintaining acceptable recall).
- **Tenant Filtering**: The `tenant_id` payload index is created as a `keyword` index to ensure the pre-filter is evaluated in O(1) time before the vector ANN search begins.

### Application Layer
- **Async Heavy Work**: Contract parsing, OCR, and PII tagging are strictly asynchronous via the Outbox + Message Bus. The HTTP upload endpoint returns `202 Accepted` immediately after blob storage.
- **Pagination**: All list APIs enforce a maximum `pageSize` of 100.
- **Connection Pooling**: `Max Pool Size=100` configured for the SQL connection string in production environments.
