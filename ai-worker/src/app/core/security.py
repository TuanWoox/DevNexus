import jwt
from fastapi import Depends, Request, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from src.app.core.config import get_settings, Settings
from src.app.core.exceptions import AIWorkerException

security_scheme = HTTPBearer()
api_key_header = APIKeyHeader(name="X-Internal-Api-Key", auto_error=True)

async def verify_internal_api_key(
    api_key: str = Security(api_key_header),
    settings: Settings = Depends(get_settings)
) -> bool:
    if api_key != settings.internal_api_key:
        raise AIWorkerException("Invalid Internal API Key.", status_code=403)
    return True

class CurrentUser:
    def __init__(self, user_id: str, email: str, role: str):
        self.user_id = user_id
        self.email = email
        self.role = role

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security_scheme),
    settings: Settings = Depends(get_settings)    
) -> CurrentUser:
    try:
        payload = jwt.decode(
            token.credentials, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience
        )

        # Support both standard JWT claims and Microsoft/ASP.NET Identity claims
        user_id_claim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        email_claim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        role_claim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"

        user_id: str = payload.get("sub") or payload.get(user_id_claim) # type: ignore
        email: str = payload.get("email") or payload.get(email_claim, "") # type: ignore
        role: str = payload.get("role") or payload.get(role_claim, "Developer") # type: ignore

        if user_id is None:
            raise AIWorkerException("Invalid token payload.", status_code=401)
            
        return CurrentUser(user_id=user_id, email=email, role=role)
    except jwt.ExpiredSignatureError:
        raise AIWorkerException("Token has expired.", status_code=401)
    except jwt.InvalidIssuerError:
        raise AIWorkerException("Invalid token issuer.", status_code=401)
    except jwt.InvalidAudienceError:
        raise AIWorkerException("Invalid token audience.", status_code=401)
    except jwt.PyJWTError as e:
        raise AIWorkerException(f"Could not validate credentials: {str(e)}", status_code=401)