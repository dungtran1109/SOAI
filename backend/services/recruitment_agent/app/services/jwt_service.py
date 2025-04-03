from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

class JWTService:
    SECRET_KEY = "655368566D597133743677397A244326452948404D635166546A576E5A723475"  # Same as in Spring Boot
    ALGORITHM = "HS256"  #Matches Spring Boot's algorithm
    security = HTTPBearer()

    @classmethod
    def verify_jwt(cls, credentials: HTTPAuthorizationCredentials = Security(security)):
        """Verifies the JWT token and returns the payload if valid."""
        token = credentials.credentials
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return payload
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
