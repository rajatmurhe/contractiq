from __future__ import annotations
from typing import Annotated, Any
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages
from pydantic import BaseModel
import operator

# All fields that must be in the graph state
class ContractReviewState(TypedDict):
    # Identity (NEVER from model output)
    tenant_id: str
    run_id: str
    contract_id: str

    # Versioning (recorded for every run)
    workflow_version: str
    agent_version: str
    model_id: str
    model_version: str
    prompt_version: str

    # Document (populated by ingestion_node)
    document: dict[str, Any] | None  # ContractDocument as dict

    # Agent outputs
    clauses: Annotated[list[dict[str, Any]], operator.add]  # fan-in accumulator
    risk_report: dict[str, Any] | None
    compliance_gaps: Annotated[list[dict[str, Any]], operator.add]
    critic_pass: bool
    critic_unverified_count: int
    extraction_retry_count: int

    # Human-in-loop
    human_decision: str | None  # "Approved" | "Rejected" | "EditAndApprove"
    human_edited_clauses: list[dict[str, Any]] | None
    approver_id: str | None

    # Integration
    integration_payloads: dict[str, Any] | None  # {sap: {...}, salesforce: {...}}
    integration_results: dict[str, Any] | None

    # Budget tracking
    token_budget_remaining: int
    tokens_used: Annotated[int, operator.add]
    estimated_cost_usd: float

    # Audit
    audit_record: dict[str, Any] | None
    retrieved_chunk_ids: Annotated[list[str], operator.add]
    tool_call_log: Annotated[list[dict[str, Any]], operator.add]

    # Error handling
    error: str | None
    error_node: str | None

    # Messages for agents
    messages: Annotated[list[Any], add_messages]
