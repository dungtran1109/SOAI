from pydantic import BaseModel

class CVUploadResponseSchema(BaseModel):
    message: str
