
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config.logging import AppLogger
import base64
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Request, HTTPException, status

logger = AppLogger(__name__)

class CustomHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:
        auth = request.headers.get("Authorization")
        if not auth:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Authorization header missing")

        try:
            scheme, credentials = auth.split()
            if scheme.lower() != "bearer":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid authentication scheme")
        except Exception:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Authorization header format")

        return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)

class JWTService:
    SECRET_KEY_ENCODED = "655368566D597133743677397A244326452948404D635166546A576E5A723475"  # Same as encoded secret key in Spring Boot
    ALGORITHM = "HS256"  #Matches Spring Boot's algorithm
    security = CustomHTTPBearer()

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
            logger.info(f"Decoding token: {token}")
            decoded_key = base64.b64decode(cls.SECRET_KEY_ENCODED)
            logger.info(f"Decoded key: {decoded_key}")
            payload = jwt.decode(token, decoded_key, algorithms=[cls.ALGORITHM])
            logger.info(f"Payload: {payload}")
            username = payload.get("sub")
            role = payload.get("role")
            logger.info(f"User '{username}' authenticated with role '{role}'")
            return payload
        except JWTError as e:
            logger.error(f"[JWT ERROR] {e}")
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