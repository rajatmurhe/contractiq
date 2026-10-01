<ADR-004: MCP vs REST — Why Both Coexist>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ is a multi-tenant platform. The application services communicate via REST. However, our internal AI agents (running in LangGraph) need a discoverable, schema-typed, and permission-scoped interface to interact with external systems (like SAP or Salesforce) and internal resources. Furthermore, we need to allow external agentic clients (e.g., Claude Desktop or custom tenant agents) to securely call ContractIQ capabilities.
Security is paramount: model outputs are inherently untrusted and must never bypass tenant authorization.

## Decision
We will support both **REST** and the **Model Context Protocol (MCP)**, with a strict hierarchical relationship:
- **REST** is the underlying application interface for service-to-service communication.
- **MCP** is the agentic interface for tool/resource/prompt discovery.
The MCP server will *never* contain direct database or business logic side-effects. It functions strictly as an intelligent frontend that maps agent intent to the existing REST application services. The MCP server calls the application services passing the user/agent's authorization token, meaning standard REST authorization enforces security.

**Exact Request Flow:**
1. AI agent (or Claude Desktop) → MCP tool call `create_crm_opportunity`.
2. MCP server: Receives call, validates Bearer token, derives `tenant_id` from the JWT `tid` claim.
3. MCP server checks agent scopes (e.g., `crm:write`) and verifies the contract workflow is in an `Approved` state.
4. MCP server → REST call to `integrations-api` (passing the token).
5. `integrations-api` → Executes business logic (e.g., SAP adapter) and audits the action.
6. MCP server formats REST response into MCP tool result and returns to agent.

## Alternatives Considered
1. **REST Only (No MCP):** Expose OpenAPI schemas to agents.
   - *Trade-off:* OpenAPI schemas are often too large and verbose for LLM context windows. MCP provides a standardized way to dynamically list tools, prompt templates, and resources specifically optimized for LLM consumption, improving reliability.
2. **GraphQL:**
   - *Trade-off:* Excellent for frontends, but lacks the native integration with foundational models and agent desktop clients that MCP is rapidly standardizing.
3. **MCP with Direct DB Access:**
   - *Trade-off:* Unacceptable security risk. Re-implementing authorization logic inside the MCP server violates DRY and risks bypassing the robust EF Core / SQL RLS layers built into our .NET APIs.

## Consequences
### Positive
- AI agents get a clean, LLM-optimized interface for interacting with the system.
- Security logic is strictly maintained in the core .NET monolith. Models cannot bypass authorization.
- Immediate compatibility with external MCP clients (Claude Desktop).

### Negative
- Slight latency overhead (Agent → MCP Server → REST API).
- Need to maintain dual representations (OpenAPI swagger for standard clients, MCP tool schemas for agents).

### Neutral
- The MCP server must act as a seamless proxy, translating MCP JSON-RPC into standard REST HTTP requests.

## Failure Modes and Mitigations
1. **MCP tool used to bypass authorization:** An internal agent accesses the MCP server without a valid tenant context, and the MCP server executes the command with elevated privileges.
   - *Mitigation:* The MCP server runs with zero default privileges. It must pass the invoking agent's JWT to the REST API. The REST API's middleware enforces authorization, not the MCP server.
2. **Model injecting tenant_id argument:** A malicious prompt instructs the LLM to call `update_contract(tenant_id="TARGET_TENANT", ...)` to overwrite another tenant's data.
   - *Mitigation:* Tools exposed via MCP *must not* accept `tenant_id` as an argument. The MCP server derives `tenant_id` exclusively from the cryptographically verified JWT claim.
3. **Prompt injection via tool output:** The REST API returns untrusted user-generated content (e.g., a raw contract clause) which the MCP server blindly passes back to the LLM, triggering an injection attack.
   - *Mitigation:* The MCP server must sanitize or strongly type tool outputs. High-risk tool outputs should be flagged, and the system prompts must instruct the LLM to treat tool outputs as untrusted data.

## Implementation Notes
The Python MCP Server acts as an auth-aware proxy.
```python
@mcp.tool()
async def create_crm_opportunity(ctx: Context, contract_id: str, value: float) -> str:
    # 1. Extract token from MCP context (provided during connection/request)
    auth_token = ctx.metadata.get("authorization")
    
    # 2. No tenant_id in arguments! It's handled by the downstream REST API based on the token.
    headers = {"Authorization": auth_token}
    
    # 3. Proxy to the secure .NET REST API
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{REST_GATEWAY_URL}/api/integrations/crm/opportunities",
            json={"contract_id": contract_id, "estimated_value": value},
            headers=headers
        )
        
    resp.raise_for_status()
    return f"Opportunity created: {resp.json()['opportunity_id']}"
```
</ADR-004: MCP vs REST — Why Both Coexist>
