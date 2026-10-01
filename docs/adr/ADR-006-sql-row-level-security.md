<ADR-006: SQL Server Row-Level Security for Defense in Depth>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ guarantees strict multi-tenant data isolation. Currently, we use application-level filtering via Entity Framework Core global query filters (`builder.Entity<Contract>().HasQueryFilter(c => c.TenantId == currentTenantId)`).
However, application-level filtering is vulnerable to human error: a developer might write a raw SQL query (e.g., using Dapper for performance) and forget the `WHERE tenant_id` clause, or use `IgnoreQueryFilters()` inappropriately.
We require a second layer of enforcement at the database level that guarantees cross-tenant data leakage is impossible, even if the application code fails.

## Decision
We will implement **SQL Server Row-Level Security (RLS)** on all tenant-scoped tables as a defense-in-depth measure. 
The database engine will automatically evaluate a security predicate on every `SELECT`, `UPDATE`, and `DELETE`. The .NET middleware will be responsible for setting the `SESSION_CONTEXT(N'TenantId')` at the very beginning of every HTTP request or background job execution.

## Alternatives Considered
1. **Application-Level Filtering Only:** Rely purely on EF Core global query filters.
   - *Trade-off:* High risk of accidental data leakage via raw SQL, background workers, or reporting tools that connect directly to the database.
2. **Database-Per-Tenant:**
   - *Trade-off:* Unmanageable operational overhead. Provisioning, migrating, and monitoring thousands of separate SQL Server databases drastically increases infrastructure costs and deployment times.
3. **Schema-Per-Tenant:**
   - *Trade-off:* Better than DB-per-tenant, but still complicates EF Core migrations and connection string management. It limits connection pooling effectiveness.

## Consequences
### Positive
- Absolute guarantee of tenant isolation at the storage engine level.
- Read-only replicas and reporting tools (like PowerBI) connected to the database are inherently restricted if configured properly.
- Developers don't have to worry about accidentally leaking data in complex JOINs.

### Negative
- Slight performance overhead on every query to evaluate the scalar function.
- Debugging can be frustrating; running `SELECT * FROM Contracts` in SSMS returns 0 rows unless the DBA manually sets the session context.

### Neutral
- Requires strict management of the connection pool lifecycle to ensure `SESSION_CONTEXT` is cleared or overwritten when a connection is reused.

## Failure Modes and Mitigations
1. **Connection Pool Reuse Leakage:** A connection is returned to the .NET connection pool with `SESSION_CONTEXT` set to Tenant A. It is leased by a request for Tenant B, but the middleware crashes before setting the new context, allowing Tenant B to see Tenant A's data.
   - *Mitigation:* Ensure `sp_set_session_context` is executed with the `@read_only = 0` flag so it can be overwritten. More importantly, design the middleware so that if setting the context fails, the request is immediately aborted before any business logic executes.
2. **Blocked Write to Another Tenant:** A system-level process (like an admin dashboard) needs to update records across multiple tenants but is blocked by the block predicate.
   - *Mitigation:* Implement a specific `SystemAdmin` role. The predicate function should check if the session context `TenantId` is a special system GUID (or if a separate `IsSystem` context is set) and bypass the filter.
3. **Migration User / dbo Bypass:** The user running Entity Framework migrations is accidentally caught by RLS, causing schema updates or seed data insertion to fail. Or conversely, the application connects as `dbo` which might bypass RLS depending on setup.
   - *Mitigation:* The application must connect using a specific least-privilege user account subject to RLS, while CI/CD migrations run as a `db_owner` that is exempt from the security policy.

## Implementation Notes
The exact SQL to create the security policy:
```sql
-- Create the predicate function
CREATE FUNCTION Security.fn_tenantAccessPredicate(@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_accessResult
WHERE @tenant_id = CAST(SESSION_CONTEXT(N'TenantId') AS UNIQUEIDENTIFIER);

-- Apply to Contracts table
CREATE SECURITY POLICY Security.TenantIsolationPolicy
ADD FILTER PREDICATE Security.fn_tenantAccessPredicate(tenant_id) ON dbo.Contracts,
ADD BLOCK PREDICATE Security.fn_tenantAccessPredicate(tenant_id) ON dbo.Contracts AFTER INSERT
WITH (STATE = ON);
```

In .NET, the context is set via middleware:
```csharp
public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ContractIqDbContext dbContext, ITenantAccessor tenantAccessor)
    {
        var tenantId = tenantAccessor.CurrentTenantId;
        
        // Execute raw SQL to set the session context on the current connection
        await dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"EXEC sp_set_session_context @key=N'TenantId', @value={tenantId}");

        await _next(context);
    }
}
```
We also maintain an automated integration test that explicitly calls `.IgnoreQueryFilters()` in EF Core and asserts that cross-tenant queries still return 0 results, proving the RLS layer works.
</ADR-006: SQL Server Row-Level Security for Defense in Depth>
