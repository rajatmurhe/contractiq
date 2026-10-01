from typing import Any, List
import httpx
from ..config import settings

async def search_contracts(query: str, tenant_id: str) -> List[dict[str, Any]]:
    """Search for contracts by semantic meaning or keywords."""
    async with httpx.AsyncClient(base_url=settings.contracts_api_url) as client:
        # Pass tenant_id securely in header to prevent cross-tenant search
        response = await client.get("/api/v1/contracts/search", params={"q": query}, headers={"X-Tenant-Id": tenant_id})
        response.raise_for_status()
        return response.json().get("items", [])

async def get_contract(contract_id: str, tenant_id: str) -> dict[str, Any]:
    """Retrieve metadata and full text for a specific contract."""
    async with httpx.AsyncClient(base_url=settings.contracts_api_url) as client:
        response = await client.get(f"/api/v1/contracts/{contract_id}", headers={"X-Tenant-Id": tenant_id})
        response.raise_for_status()
        return response.json()

async def get_clauses(contract_id: str, tenant_id: str) -> List[dict[str, Any]]:
    """Retrieve extracted clauses for a specific contract."""
    async with httpx.AsyncClient(base_url=settings.contracts_api_url) as client:
        response = await client.get(f"/api/v1/contracts/{contract_id}/clauses", headers={"X-Tenant-Id": tenant_id})
        response.raise_for_status()
        return response.json().get("items", [])

async def get_risk_report(contract_id: str, tenant_id: str) -> dict[str, Any]:
    """Retrieve the playbook risk evaluation report for a contract."""
    async with httpx.AsyncClient(base_url=settings.contracts_api_url) as client:
        response = await client.get(f"/api/v1/contracts/{contract_id}/risk-report", headers={"X-Tenant-Id": tenant_id})
        response.raise_for_status()
        return response.json()
