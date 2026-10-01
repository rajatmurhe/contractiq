from typing import Any
from app.supervisor.state import ContractReviewState

async def compliance_agent(state: ContractReviewState) -> dict[str, Any]:
    gaps = [{"description": "Missing GDPR clause", "severity": "HIGH"}]
    return {
        "compliance_gaps": gaps,
        "tokens_used": 100,
        "tool_call_log": [{"node": "compliance", "action": "check_gdpr_gap"}]
    }
