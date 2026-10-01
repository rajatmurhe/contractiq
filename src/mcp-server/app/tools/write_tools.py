from typing import Any
import httpx
from ..config import settings

async def create_crm_opportunity(account_id: str, contract_id: str, value: float, currency: str, stage: str, tenant_id: str, idempotency_key: str) -> dict[str, Any]:
    """
    Propose creating a Salesforce opportunity.
    NOTE: The AI does not directly execute this. It returns a proposal payload to the workflow, 
    which then asks for human approval before calling the Integrations service.
    """
    payload = {
        "accountId": account_id,
        "contractId": contract_id,
        "value": value,
        "currency": currency,
        "stageName": stage,
        "idempotencyKey": idempotency_key
    }
    
    # In a full implementation, this tool might actually submit the *proposal* to the Workflow API
    # rather than hitting the Integration API directly, or it might just return the payload structure 
    # to LangGraph state. We'll return the payload so the LangGraph integration_node can act on it.
    
    return {
        "status": "proposal_generated",
        "action": "create_crm_opportunity",
        "payload": payload,
        "message": "Payload prepared. Requires application-level authorization and human approval."
    }

async def start_workflow(contract_id: str, workflow_type: str, tenant_id: str, user_id: str) -> dict[str, Any]:
    """Start a new review workflow for a given contract."""
    async with httpx.AsyncClient(base_url=settings.workflow_api_url) as client:
        payload = {
            "contractId": contract_id,
            "workflowType": workflow_type,
            "startedBy": user_id
        }
        response = await client.post("/api/v1/workflows", json=payload, headers={"X-Tenant-Id": tenant_id})
        response.raise_for_status()
        return response.json()
