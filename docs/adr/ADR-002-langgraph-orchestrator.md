<ADR-002: LangGraph as Workflow Orchestrator>
**Status:** Accepted  
**Date:** 2026-10-01  
**Deciders:** Principal Engineering Team

## Context
ContractIQ requires a robust workflow orchestrator for multi-agent workflows. The workflow follows this pattern: Ingestion → Extraction + Risk + Compliance (parallel) → Critic → Approval Gate (conditional interrupt) → Integration → Audit.
We must support:
- Typed state and full lineage per run.
- Persistent checkpointing and resumability (if an agent process crashes mid-run, it must resume exactly where it left off).
- Human-in-the-loop (interrupts) for high-risk actions.
- Parallel fan-out/fan-in execution.

## Decision
We will use **LangGraph** as our single orchestrator for the AI agent workloads. LangGraph will exclusively own the workflow state, SQL checkpointing, retries, human interrupts, and the workflow lifecycle.

**Distinction: Agentic Nodes vs Deterministic Steps**
- *Deterministic Steps:* Rigid edges in the graph (e.g., standard API calls, data formatting) that always execute in a predefined order.
- *Agentic Nodes:* Nodes where pathing and execution are dynamic, driven by an LLM's decision-making process (using conditional edges based on the LLM's tool calls or reasoning outputs).

## Alternatives Considered
1. **Temporal / Airflow / Prefect:** Excellent for distributed, deterministic tasks.
   - *Trade-off:* They lack native primitives for LLM agent loops, context window management, and conversational state passing. Building multi-agent debate or dynamic LLM-driven graph routing on top of Temporal requires heavy abstraction.
2. **Custom FSM (Finite State Machine) / Bare Python Asyncio:**
   - *Trade-off:* High maintenance burden. Implementing reliable checkpointing, human-in-the-loop interrupts, and parallel fan-out natively in asyncio is error-prone and reinvents the wheel.
3. **CrewAI:**
   - *Trade-off:* Too heavily abstracted. We need granular control over the state schema and conditional edges to ensure compliance and auditability.

## Consequences
### Positive
- Native support for LLM-driven control flow (conditional edges).
- Built-in SQL checkpointer provides the required resumability and lineage for audit trails.
- Built-in human-in-the-loop primitives (`interrupt_before`, `interrupt_after`).

### Negative
- Python/LangGraph ecosystem moves fast; APIs may introduce breaking changes.
- LangGraph state can become bloated if we blindly append massive contract contexts to the state history, risking context window exhaustion.

### Neutral
- Teams must learn LangGraph's specific flavor of graph definition and state management.

## Failure Modes and Mitigations
1. **LangGraph Checkpoint Schema Migration:** LangGraph updates might break existing checkpoint schemas in SQLite/Postgres, rendering in-flight workflows un-resumable.
   - *Mitigation:* Pin LangGraph/langgraph-checkpoint versions strictly. Drain in-flight workflows before upgrading major versions, or implement a fallback state-recovery script.
2. **State Serialization Bugs:** Placing non-serializable objects (e.g., open file handles, raw DB connections, complex Pydantic models with custom validators) into the LangGraph state.
   - *Mitigation:* Enforce strict, simple Pydantic models or standard Python dictionaries for the `State` definition. All nodes must validate input/output using `.model_dump(mode='json')`.
3. **Interrupt State Corruption:** A human approval gate modifies the state payload incorrectly, causing downstream agentic nodes to crash due to schema validation failure.
   - *Mitigation:* Provide strict schema validation at the re-entry point of the graph. The approval gate API must use the exact same Pydantic models as the graph state.

## Implementation Notes
Implement the workflow using a `StateGraph` and a Postgres checkpointer.
```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver

class WorkflowState(TypedDict):
    contract_id: str
    tenant_id: str
    extracted_clauses: list[dict]
    risk_score: float
    requires_human: bool

builder = StateGraph(WorkflowState)
builder.add_node("extraction", extraction_node)
builder.add_node("risk_assessment", risk_node)
builder.add_node("human_approval", human_approval_node)

# Conditional edge logic
def route_approval(state: WorkflowState):
    if state["requires_human"] or state["risk_score"] > 0.8:
        return "human_approval"
    return "integration"

builder.add_conditional_edges("risk_assessment", route_approval)

# Interrupt before integration if human approval is needed
graph = builder.compile(
    checkpointer=PostgresSaver(conn_pool),
    interrupt_before=["human_approval"]
)
```
</ADR-002: LangGraph as Workflow Orchestrator>
