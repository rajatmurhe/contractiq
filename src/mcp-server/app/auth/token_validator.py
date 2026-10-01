from pydantic import BaseModel
import jwt
from typing import Optional

class TokenClaims(BaseModel):
    tid: str
    sub: str
    roles: list[str]

def validate_token(token: str) -> Optional[TokenClaims]:
    # Mock implementation of JWT validation
    # In production, this would use PyJWT to validate against Keycloak
    try:
        # Decode without verification just for scaffolding
        decoded = jwt.decode(token, options={"verify_signature": False})
        return TokenClaims(
            tid=decoded.get("tid", "mock-tenant-id"),
            sub=decoded.get("sub", "mock-user"),
            roles=decoded.get("roles", ["user"])
        )
    except Exception:
        # Fallback for development without real tokens
        return TokenClaims(tid="dev-tenant", sub="dev-user", roles=["admin", "crm:write"])
