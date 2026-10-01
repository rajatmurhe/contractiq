<ADR-003: AutoGen Scope — Negotiation Sub-team Only>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
Our multi-tenant platform, ContractIQ, involves a complex contract negotiation use case requiring dynamic debate and consensus between different personas: an Advisor, a Counterparty-Simulator, and a Legal-Reviewer. AutoGen provides excellent primitives for multi-agent group chats and debate patterns.
However, introducing AutoGen alongside LangGraph (our primary orchestrator, see ADR-002) creates a significant architectural risk: having two overlapping orchestrators fighting for state management, checkpointing, and workflow control.

## Decision
We will use **AutoGen** exclusively for the negotiation sub-team (Tier 2). AutoGen will act strictly as a localized multi-agent debate engine. 
LangGraph remains the global orchestrator. It will call the AutoGen group chat as a *single, synchronous node* within the graph. AutoGen will *never* own global workflow state, long-term checkpointing, or system-level side effects. The boundary is defined by a clean, stateless interface: `NegotiationRequest → NegotiationResult`.

## Alternatives Considered
1. **Extend LangGraph Nodes for Debate:** Implement the debate loop manually using LangGraph cyclical edges.
   - *Trade-off:* Reinvents the wheel. AutoGen's `GroupChat` and speaker selection logic are highly optimized for natural conversation flows, whereas modeling this in LangGraph requires complex custom routing logic.
2. **CrewAI:**
   - *Trade-off:* CrewAI is too rigid (process-oriented) for the fluid, unpredictable debate needed in contract negotiation simulation.
3. **AutoGen as the Primary Orchestrator:** Replace LangGraph entirely.
   - *Trade-off:* AutoGen lacks the deterministic workflow guarantees, typed state graph enforcement, and human-in-the-loop interruption primitives that LangGraph provides for the larger compliance pipeline.

## Consequences
### Positive
- We leverage the best-in-class multi-agent debate capabilities of AutoGen without compromising the deterministic, auditable workflow of LangGraph.
- Separation of concerns: LangGraph handles "workflow", AutoGen handles "simulation/debate".

### Negative
- Developers must context-switch between two different AI framework paradigms (LangGraph state dicts vs AutoGen messages).
- Testing becomes slightly more complex, requiring mocks for the AutoGen sub-system when testing the LangGraph orchestrator.

### Neutral
- We must enforce a strict `max_turns` limit in AutoGen to prevent it from stalling the LangGraph node indefinitely.

## Failure Modes and Mitigations
1. **AutoGen State Bleeding:** Agents in AutoGen attempt to access or modify global variables or database state directly, bypassing LangGraph's state management.
   - *Mitigation:* Execute AutoGen in a completely stateless wrapper. Provide tools to AutoGen agents that are strictly read-only (e.g., `read_clause`, `search_precedent`).
2. **Infinite Debate Loops:** The Advisor and Counterparty-Simulator endlessly disagree, causing the AutoGen node to hang, locking up the LangGraph worker.
   - *Mitigation:* Strictly enforce `max_round` configurations in the `GroupChat` and wrap the LangGraph node execution in an asyncio timeout. If it times out, the node returns a failure state that triggers human review.
3. **Cost Overruns:** Multi-agent debates consume massive amounts of tokens as the context window grows with each message.
   - *Mitigation:* Limit the context window provided to the AutoGen `NegotiationRequest` (e.g., only pass the specific clause under dispute, not the entire 100-page contract) and enforce strict token limits on the LLM backend for these specific agents.

## Implementation Notes
LangGraph calls AutoGen as an isolated function.
```python
# The clear boundary interface
class NegotiationRequest(BaseModel):
    clause_text: str
    tenant_position: str
    
class NegotiationResult(BaseModel):
    agreed_text: str
    debate_summary: str

# Inside the LangGraph Node
def negotiation_node(state: WorkflowState) -> dict:
    req = NegotiationRequest(
        clause_text=state["current_clause"],
        tenant_position=state["tenant_playbook_rule"]
    )
    
    # AutoGen execution is localized and contained
    chat = autogen.GroupChat(
        agents=[advisor, counterparty, reviewer],
        messages=[],
        max_round=5 # Crucial mitigation for infinite loops
    )
    manager = autogen.GroupChatManager(groupchat=chat, llm_config=llm_config)
    
    # Kickoff
    advisor.initiate_chat(manager, message=req.model_dump_json())
    
    # Extract result and return to LangGraph state
    return {"negotiation_result": parse_autogen_result(chat.messages)}
```
</ADR-003: AutoGen Scope — Negotiation Sub-team Only>
