from jose import jwt, JWTError
import base64
from fastapi import HTTPException, Security, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.log_config import AppLogger
from schemas.response import make_standard_response

logger = AppLogger(__name__)


class CustomHTTPBearer(HTTPBearer):
    async def __call__(self, request: Request) -> HTTPAuthorizationCredentials:
        auth = request.headers.get("Authorization")
        if not auth:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authorization header missing",
            )

        try:
            scheme, credentials = auth.split()
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid authentication scheme",
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid Authorization header format",
            )

        return HTTPAuthorizationCredentials(scheme=scheme, credentials=credentials)


class JWTService:
    SECRET_KEY_ENCODED = "655368566D597133743677397A244326452948404D635166546A576E5A723475"  # Same as encoded secret key in Spring Boot
    ALGORITHM = "HS256"  # Matches Spring Boot's algorithm
    security = CustomHTTPBearer()

    @staticmethod
    def verify_jwt_token(
        token,
    ) -> dict:
        """Verifies the JWT token and returns the payload if valid."""
        try:
            logger.info(f"Decoding token: {token}")
            decoded_key = base64.b64decode(JWTService.SECRET_KEY_ENCODED)
            payload = jwt.decode(token, decoded_key, algorithms=[JWTService.ALGORITHM])
            logger.info(f"Payload: {payload}")
            username = payload.get("sub")
            role = payload.get("role")
            logger.info(f"User '{username}' authenticated with role '{role}'")
            payload["token"] = token
            return payload
        except JWTError as e:
            logger.error(f"[JWT ERROR] {e}")
        return None

    @classmethod
    def verify_jwt(cls, credentials: HTTPAuthorizationCredentials = Security(security)):
        """Verifies the JWT token and returns the payload if valid."""
        return JWTService.verify_jwt_token(credentials.credentials)

    # Use when endpoints need to restrict RBAC for specific user
    # [ADMIN, USER]
    # Eg: Parse to @router parameter function: current_user: dict = JWTService.require_role("ADMIN")
    @staticmethod
    def require_role(required_role):
        """Use when endpoints need to restrict RBAC for a specific user role (e.g., ADMIN)."""

        def role_checker(user: dict = Depends(JWTService.verify_jwt)):
            if user.get("role") != required_role:
                raise HTTPException(status_code=403, detail="Insufficient permission")
            return user

        return Depends(role_checker)
