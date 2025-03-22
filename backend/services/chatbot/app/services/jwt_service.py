from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config.logging import AppLogger
import base64

logger = AppLogger(__name__)

class JWTService:
    SECRET_KEY_ENCODED = "655368566D597133743677397A244326452948404D635166546A576E5A723475"  # Same as encoded secret key in Spring Boot
    ALGORITHM = "HS256"  #Matches Spring Boot's algorithm
    security = HTTPBearer()

    @classmethod
    def verify_jwt(cls, credentials: HTTPAuthorizationCredentials = Security(security)):
        """Verifies the JWT token and returns the payload if valid."""
        token = credentials.credentials
        try:
            # Already covered checking token expiration
            # If the token expired, then can not be decoded
            # Example payload
            # {
                # "sub": "admin1",
                # "role": "ADMIN",
                # "iat": 1742643508,
                # "exp": 1742657908
            # }
            decoded_key = base64.b64decode(cls.SECRET_KEY_ENCODED)
            payload = jwt.decode(token, decoded_key, algorithms=[cls.ALGORITHM])
            username = payload.get("sub")
            role = payload.get("role")
            logger.info(f"User '{username}' authenticated with role '{role}'")
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Use when endpoints need to restrict RBAC for specific user
    # [ADMIN, USER]
    # Eg: Parse to @router parameter function: current_user: dict = JWTService.require_role("ADMIN")
    @staticmethod
    def require_role(required_role):
        def role_checker(user: dict = Depends(JWTService.verify_jwt)):
            if user.get("role") != required_role:
                raise HTTPException(status_code=403, detail="Insufficient permission")
            return user
        return Depends(role_checker)

get_current_user = Depends(JWTService.verify_jwt)