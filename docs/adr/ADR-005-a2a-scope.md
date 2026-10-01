<ADR-005: A2A External Interop Scope>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
Our enterprise customers want their internal agents (e.g., a custom HR agent or Procurement agent) to interact with ContractIQ's contract intelligence agents. This requires an Agent-to-Agent (A2A) protocol. 
Full A2A implementation implies complex capabilities: agent discovery, asynchronous task queues, bidirectional streaming, state handoffs, and multi-turn conversational synchronization. This presents a massive scope creep risk that could derail the v2 launch.

## Decision
We will implement a **Tier 1 (Minimal) A2A Interop Scope** for the initial release. 
Tier 1 includes strictly two capabilities:
1. **Discovery:** An agent card hosted at `/.well-known/agent.json` that statically describes ContractIQ's capabilities and entry points.
2. **Task Delegation:** A single, standardized task endpoint `POST /a2a/tasks` that accepts a task envelope and routes it to the appropriate LangGraph workflow asynchronously.

Full A2A orchestration, push notifications (webhooks), streaming responses, and multi-turn A2A conversations are deferred to Tier 3. External agents must poll for task status in Tier 1.

## Alternatives Considered
1. **Full A2A from Day One:** Implement asynchronous bidirectional webhooks and streaming handoffs.
   - *Trade-off:* High engineering cost. Standards for A2A communication are still highly volatile. We risk building a complex proprietary protocol that becomes obsolete in 6 months.
2. **No A2A (MCP Only):** Require external systems to connect via MCP.
   - *Trade-off:* MCP is excellent for tool execution, but it requires a persistent connection (JSON-RPC over stdio or SSE). Many external enterprise architectures prefer disconnected, asynchronous REST webhook patterns for long-running workflows (e.g., "review this 100-page contract").
3. **Proprietary Webhook Protocol:**
   - *Trade-off:* Creates vendor lock-in and increases integration friction for customers. Adhering to early A2A draft standards via `/.well-known` is more future-proof.

## Consequences
### Positive
- Strictly limits engineering scope, ensuring on-time delivery.
- Provides a clear, simple integration path for external developers (HTTP POST and poll).
- Isolates A2A traffic to a specific API gateway route, making rate-limiting and auditing straightforward.

### Negative
- External agents must use a polling mechanism to check task status, which is inefficient.
- Cannot support real-time collaborative "debates" between an external agent and our internal AutoGen agents.

### Neutral
- Standardizes our internal workflow entry points to accept generic task envelopes.

## Failure Modes and Mitigations
1. **Unauthorized Capability Discovery:** External agents accessing `/.well-known/agent.json` and discovering capabilities or internal tools they shouldn't have access to, aiding reconnaissance.
   - *Mitigation:* `agent.json` must only contain public, generic capability descriptions. Tenant-specific tools or capabilities must not be exposed here.
2. **Task Envelope Injection Attacks:** Malicious payloads hidden inside the generic A2A task envelope intended to exploit the internal orchestrator.
   - *Mitigation:* Strict schema validation on `POST /a2a/tasks`. The payload must be heavily sanitized, and prompt instructions derived from external tasks must be wrapped in XML tags or delimiters to prevent prompt injection in downstream LangGraph nodes.
3. **Polling Exhaustion:** External agents polling the task status endpoint aggressively, causing a DDOS on the database.
   - *Mitigation:* Implement aggressive API Gateway rate-limiting specifically for A2A polling endpoints, and serve status checks from a high-performance read cache (Redis) rather than hitting the primary SQL store.

## Implementation Notes
The agent card is a static file served by the gateway.
The endpoint maps generic intents to LangGraph graphs.
```python
# FastAPI endpoint for Tier 1 A2A
class A2ATaskEnvelope(BaseModel):
    intent: Literal["review_contract", "extract_clauses"]
    payload: dict
    callback_url: Optional[str] = None # Ignored in Tier 1

@app.post("/a2a/tasks")
async def create_a2a_task(envelope: A2ATaskEnvelope, request: Request):
    tenant_id = extract_tenant_id(request)
    
    if envelope.intent == "review_contract":
        # Route to LangGraph orchestrator
        thread_id = await orchestrator.kickoff_review(
            tenant_id=tenant_id, 
            contract_data=envelope.payload
        )
        return {"task_id": thread_id, "status": "processing"}
        
    raise HTTPException(status_code=400, detail="Unsupported intent")
```
</ADR-005: A2A External Interop Scope>
