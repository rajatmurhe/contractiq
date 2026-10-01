-- RLS Policies for ContractIQ Multi-Tenant Isolation
-- Applied via EF Core Migrations or raw SQL

-- 1. Create a Schema for Security Policies
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'Security')
BEGIN
    EXEC('CREATE SCHEMA [Security]');
END
GO

-- 2. Create the Predicate Function
CREATE OR ALTER FUNCTION [Security].[fn_TenantIsolationPredicate](@TenantId uniqueidentifier)
    RETURNS TABLE
    WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_TenantIsolationPredicate_Result
    WHERE 
        -- Allow if the session context TenantId matches the row's TenantId
        CAST(SESSION_CONTEXT(N'TenantId') AS uniqueidentifier) = @TenantId
        -- Bypass rule: Allow if session context is a super-admin process (e.g. background worker)
        OR CAST(SESSION_CONTEXT(N'BypassRLS') AS bit) = 1;
GO

-- 3. Apply to Contracts Table
CREATE SECURITY POLICY [Security].[TenantIsolationPolicy_Contracts]
    ADD FILTER PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[Contracts],
    ADD BLOCK PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[Contracts]
    WITH (STATE = ON);
GO

-- 4. Apply to Clauses Table
CREATE SECURITY POLICY [Security].[TenantIsolationPolicy_Clauses]
    ADD FILTER PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[Clauses],
    ADD BLOCK PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[Clauses]
    WITH (STATE = ON);
GO

-- 5. Apply to RiskReports Table
CREATE SECURITY POLICY [Security].[TenantIsolationPolicy_RiskReports]
    ADD FILTER PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[RiskReports],
    ADD BLOCK PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[RiskReports]
    WITH (STATE = ON);
GO

-- 6. Apply to AuditEvents Table
CREATE SECURITY POLICY [Security].[TenantIsolationPolicy_AuditEvents]
    ADD FILTER PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[AuditEvents],
    ADD BLOCK PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[AuditEvents]
    WITH (STATE = ON);
GO

-- 7. Apply to WorkflowRuns Table
CREATE SECURITY POLICY [Security].[TenantIsolationPolicy_WorkflowRuns]
    ADD FILTER PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[WorkflowRuns],
    ADD BLOCK PREDICATE [Security].[fn_TenantIsolationPredicate](TenantId) ON [dbo].[WorkflowRuns]
    WITH (STATE = ON);
GO
