<ADR-010: Tenant Isolation Across All Data Planes>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ is a multi-tenant SaaS platform handling highly sensitive enterprise data (contracts). Data leakage between tenants is a critical, existential security failure. We must enforce tenant isolation at every data plane independently. We rely on defense in depth: no single layer failure should result in cross-tenant leakage.

## Decision
We will enforce strict tenant isolation at every data plane, backed by automated leak tests per plane to verify enforcement.

| Plane | Enforcement | Setup | Automated Test | Failure Impact |
|---|---|---|---|---|
| **API** | Tenant from Entra/Keycloak `tid` JWT claim. | Middleware extracts `tid` claim and sets `TenantContext`. | API tests authenticating as Tenant A attempting to access Tenant B endpoints. | **Medium:** Downstream layers (EF/SQL) should catch the leak if API fails. |
| **EF Core** | Global query filters on all tenant-scoped entities. | `modelBuilder.Entity<T>().HasQueryFilter(e => e.TenantId == _tenantContext.TenantId);` | Unit tests verifying generated SQL includes `WHERE TenantId = @id`. | **High:** Risk of data leak if SQL RLS is also bypassed. |
| **SQL** | RLS policies based on `SESSION_CONTEXT`. (See ADR-006). | Interceptor sets `EXEC sp_set_session_context 'TenantId', @id;` | Integration tests verifying direct SQL queries without context return 0 rows. | **Critical:** Final defense line for relational data. |
| **Blob** | Tenant-scoped container paths. | Azure Storage paths: `contracts/{tenantId}/...` | Integration tests attempting cross-tenant blob reads. | **Critical:** Direct unauthorized access to raw contract files. |
| **Qdrant** | Metadata `tenant_id` filter injected BEFORE results reach model. | `filter: { must: [{ key: "tenant_id", match: { value: current_tenant } }] }` | Vector search tests verifying results only contain current tenant chunks. | **High:** AI model might hallucinate using other tenants' data. |
| **Redis** | Key prefixing. | `RedisKeyHelper` automatically prepends `tenant:{tenantId}:` to all keys. | Cache tests ensuring keys are partitioned correctly. | **Medium:** Cache poisoning or session hijacking. |
| **Message Bus** | `tenant_id` in message envelope. | Publisher injects header; Consumer validates `tenant_id` before processing. | Async tests sending cross-tenant messages and expecting DLQ rejection. | **High:** Background tasks executing in wrong context. |
| **Agent State** | `tenant_id` in `ContractReviewState`. | Set immutably from JWT at LangGraph workflow start. | Workflow tests verifying state `tenant_id` cannot be mutated by nodes. | **High:** Workflow acts on wrong tenant data. |
| **MCP** | Derived server-side from token claim. | Tool argument `tenant_id` is explicitly ignored by MCP server. | Tool call tests passing mismatched `tenant_id` args. | **High:** Tools execute against wrong tenant. |
| **Logs** | `tenant_id` tag on OTel spans. | OTel middleware adds `tenant.id` attribute. No cross-tenant data in message text. | Log validation tests checking for leakage in text fields. | **Low:** Privacy issue, but not direct data access. |

## Alternatives Considered
- **Database per tenant:** Rejected. Too expensive and complex to manage schema migrations across thousands of tenants.
- **Schema per tenant:** Rejected. SQL Server limits and performance degradation with thousands of schemas.
- **Application-only filtering (where clauses):** Rejected. Too prone to human error (developer forgetting a `where` clause).

## Consequences
### Positive
- Extremely high confidence in data isolation.
- Defense in depth mitigates the impact of single-layer bugs.
- Automated tests ensure isolation mechanisms don't regress.

### Negative
- Increased development overhead; every new data store requires isolation wiring.
- Performance overhead of enforcing filters/RLS at every level.

## Failure Modes and Mitigations
1. **JWT claim spoofing:** Attacker forges a token with another tenant's `tid`. *Mitigation:* Ensure API strictly validates token signatures against trusted IdP keys.
2. **Global query filter bypass:** Developer uses `IgnoreQueryFilters()` inappropriately. *Mitigation:* CI pipeline blocks PRs containing `IgnoreQueryFilters()` unless explicitly approved via exceptions file.
3. **Qdrant filter removed:** Bug in vector search service drops the tenant filter. *Mitigation:* The vector store access layer is centralized and heavily tested; direct access to the Qdrant client is prohibited.
4. **Redis key collision:** Developer bypasses `RedisKeyHelper` and crafts keys manually. *Mitigation:* Code reviews and static analysis rules to enforce usage of the helper class.

## Implementation Notes
Implement a centralized `ITenantContext` accessor used by all data planes.

```csharp
public interface ITenantContext
{
    string TenantId { get; }
}
// EF Core setup
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Contract>().HasQueryFilter(c => c.TenantId == _tenantContext.TenantId);
}
```
</ADR-010: Tenant Isolation Across All Data Planes>
