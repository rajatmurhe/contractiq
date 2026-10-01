from app.auth.token_validator import TokenClaims

TOOL_PERMISSIONS = {
    "search_contracts": {"role": "user", "write": False},
    "get_contract": {"role": "user", "write": False},
    "get_clauses": {"role": "user", "write": False},
    "get_risk_report": {"role": "user", "write": False},
    "list_obligations": {"role": "user", "write": False},
    "find_similar_clauses": {"role": "user", "write": False},
    "fetch_vendor_profile": {"role": "user", "write": False},
    "get_po_status_sap": {"role": "user", "write": False},
    "get_playbook": {"role": "user", "write": False},
    "get_workflow_status": {"role": "user", "write": False},
    "create_crm_opportunity": {"role": "crm:write", "write": True},
    "start_workflow": {"role": "user", "write": True},
    "request_approval": {"role": "user", "write": True},
}

def check_permission(claims: TokenClaims, tool_name: str) -> bool:
    if tool_name not in TOOL_PERMISSIONS:
        return False
        
    req_role = TOOL_PERMISSIONS[tool_name]["role"]
    
    # Admin can do anything, or check for specific role
    return "admin" in claims.roles or req_role in claims.roles
