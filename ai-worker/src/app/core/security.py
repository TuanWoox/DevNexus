import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.app.core.config import get_settings, Settings
from src.app.core.exceptions import AIWorkerException

security_scheme = HTTPBearer()

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

        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role", "Developer")

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