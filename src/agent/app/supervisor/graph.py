from langgraph.graph import StateGraph, START, END
from .state import ContractReviewState
from ..agents.extraction_agent import extract_clauses
from ..agents.risk_agent import analyze_risk
from ..agents.critic_agent import verify_extractions

def ingestion_node(state: ContractReviewState):
    # In a real run, this calls the IngestionPipeline
    # For now, simulate reading document text
    return {"document_text": "This is a contract. Limitation of Liability: Supplier shall not be liable for any damages in excess of $1,000,000. Indemnification: Each party shall indemnify the other."}

def compliance_node(state: ContractReviewState):
    return {"compliance_gaps": []}

def fan_in_node(state: ContractReviewState):
    # Dummy node to synchronize parallel branches
    return {}

def approval_gate_node(state: ContractReviewState):
    # If risk is >= threshold, trigger human approval
    risk_report = state.get("risk_report", {})
    overall_risk = risk_report.get("overall_risk", 1)
    
    # State update to indicate waiting for approval if high risk
    if overall_risk >= 3 and not state.get("human_decision"):
        return {"status": "awaiting_approval"}
    return {"status": "approved"}

def integration_node(state: ContractReviewState):
    # Prepare payload for SAP / Salesforce based on approval
    if state.get("status") == "approved" or state.get("human_decision") == "Approved":
        return {"integration_payloads": {"sap": {"action": "create_contract"}}}
    return {}

def audit_node(state: ContractReviewState):
    # Send event to Audit API
    return {}

# Build Graph
builder = StateGraph(ContractReviewState)

builder.add_node("ingestion", ingestion_node)
builder.add_node("extract", extract_clauses)
builder.add_node("risk", analyze_risk)
builder.add_node("compliance", compliance_node)
builder.add_node("critic", verify_extractions)
builder.add_node("fan_in", fan_in_node)
builder.add_node("approval_gate", approval_gate_node)
builder.add_node("integration", integration_node)
builder.add_node("audit", audit_node)

# Flow
builder.add_edge(START, "ingestion")
# Fan-out
builder.add_edge("ingestion", "extract")
builder.add_edge("ingestion", "compliance")
# Wait for extraction before risk
builder.add_edge("extract", "risk")

builder.add_edge("risk", "fan_in")
builder.add_edge("compliance", "fan_in")

# Critic validates
builder.add_edge("fan_in", "critic")

def critic_router(state: ContractReviewState):
    if state.get("critic_passed"):
        return "approval_gate"
    
    # Simple retry logic
    retry_count = state.get("extraction_retry_count", 0)
    if retry_count < 2:
        return "extract" # Route back to extraction
    return "approval_gate" # Give up and continue

builder.add_conditional_edges("critic", critic_router, ["approval_gate", "extract"])

builder.add_edge("approval_gate", "integration")
builder.add_edge("integration", "audit")
builder.add_edge("audit", END)

# Compile graph
# (Checkpointer can be added during execution)
graph = builder.compile()
