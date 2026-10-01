from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from .auth.token_validator import validate_token
from .tools.read_tools import search_contracts, get_contract, get_clauses, get_risk_report
from .tools.write_tools import create_crm_opportunity, start_workflow
from .config import settings
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ContractIQ MCP Server", version="0.1.0")

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path.startswith("/health"):
        return await call_next(request)
        
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Missing or invalid Authorization header"})
        
    token = auth_header.split(" ")[1]
    claims = validate_token(token)
    if not claims:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        
    request.state.tenant_id = claims.get("tid")
    request.state.user_id = claims.get("sub")
    request.state.roles = claims.get("roles", [])
    
    return await call_next(request)

@app.get("/health/live")
def health_live():
    return {"status": "live"}

@app.post("/mcp/tools/execute")
async def execute_tool(request: Request):
    """
    Standard Model Context Protocol execution endpoint.
    Expects {"tool": "tool_name", "arguments": {...}}
    """
    data = await request.json()
    tool_name = data.get("tool")
    args = data.get("arguments", {})
    
    tenant_id = request.state.tenant_id
    user_id = request.state.user_id
    
    logger.info(f"Executing tool {tool_name} for tenant {tenant_id}")
    
    try:
        if tool_name == "search_contracts":
            result = await search_contracts(args.get("query", ""), tenant_id)
        elif tool_name == "get_contract":
            result = await get_contract(args.get("contract_id", ""), tenant_id)
        elif tool_name == "get_clauses":
            result = await get_clauses(args.get("contract_id", ""), tenant_id)
        elif tool_name == "get_risk_report":
            result = await get_risk_report(args.get("contract_id", ""), tenant_id)
        elif tool_name == "start_workflow":
            result = await start_workflow(args.get("contract_id", ""), args.get("workflow_type", "standard"), tenant_id, user_id)
        elif tool_name == "create_crm_opportunity":
            result = await create_crm_opportunity(
                args.get("account_id"), args.get("contract_id"),
                args.get("value"), args.get("currency"),
                args.get("stage"), tenant_id, args.get("idempotency_key")
            )
        else:
            raise HTTPException(status_code=404, detail="Tool not found")
            
        return {"result": result}
    except Exception as e:
        logger.error(f"Tool execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
