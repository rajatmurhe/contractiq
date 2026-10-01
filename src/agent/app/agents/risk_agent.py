from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing import List
from ..adapters.llm_provider import get_llm

class RiskFinding(BaseModel):
    description: str = Field(description="Explanation of the risk")
    severity: int = Field(description="Severity level: 1 (Low), 2 (Medium), 3 (High), 4 (Critical)")
    citation_text: str = Field(description="The exact text from the contract causing this risk")
    related_clause_type: str = Field(description="The type of clause this relates to")

class RiskReport(BaseModel):
    overall_risk: int = Field(description="Highest severity level found (1-4)")
    findings: List[RiskFinding]

SYSTEM_PROMPT = """You are an expert legal risk analyst.
Evaluate the provided clauses against the standard corporate playbook.
Flag any clauses that represent a risk to the company.

Standard Playbook Rules:
1. Indemnification MUST be mutual. Unilateral or uncapped indemnification is HIGH (3) risk.
2. Liability MUST be capped at fees paid in the last 12 months. Uncapped liability is CRITICAL (4) risk.
3. Auto-renewal requires at least 60 days notice to cancel. Shorter notice is HIGH (3) risk.
4. Termination for convenience by supplier without cause is CRITICAL (4) risk.

Analyze the clauses and provide a structured risk report.
"""

def analyze_risk(state: dict) -> dict:
    """Risk analysis agent node."""
    clauses = state.get("extracted_clauses", [])
    if not clauses:
        return {"risk_report": {"overall_risk": 1, "findings": []}}

    llm = get_llm().with_structured_output(RiskReport)
    
    clauses_text = "\\n\\n".join([f"[{c['clause_type']}] {c['text']}" for c in clauses])

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Extracted Clauses:\n\n{clauses}")
    ])
    
    chain = prompt | llm
    result: RiskReport = chain.invoke({"clauses": clauses_text})
    
    # Calculate overall risk based on highest finding
    if result.findings:
        max_severity = max(f.severity for f in result.findings)
        result.overall_risk = max_severity
        
    return {"risk_report": result.model_dump()}
