from fastapi import HTTPException, Query
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from config.log_config import LoggingConfig, AppLogger
router = APIRouter()
from services.knowledge_base_service import KnowledgeBaseService
from models.response_models import QueryRequest, AddDocumentRequest, StandardResponse
from config.constants import *

logger = AppLogger(__name__)
@router.post("/documents/add/")
async def add_document(
    request: AddDocumentRequest,
):
    logger.debug("Adding document to knowledge base")
    result = KnowledgeBaseService.add(
        texts=request.texts,
        collection_name=request.collection_name,
        embedding_model=request.embedding_model,
    )
    if not result:
        return JSONResponse(
            content=StandardResponse(
                status="error", message=MESSAGE_ADD_DOCUMENT_FAILED
            ).dict(),
            status_code=400,
        )
    return JSONResponse(
        content=StandardResponse(
            status="success", message=MESSAGE_ADD_DOCUMENT_SUCCESS
        ).dict(),
        status_code=200,
    )


@router.post("/documents/search/")
async def search_knowledge_base(request: QueryRequest):
    """Searches for the most relevant knowledge based on user input."""
    return JSONResponse(
        content=StandardResponse(
            status="success",
            data=KnowledgeBaseService.search(
                query=request.query,
                collection_name=request.collection_name,
                embedding_model=request.embedding_model,
            ),
        ).dict(),
        status_code=200,
    )


@router.get("/documents")
async def list_documents(
    offset: int = Query(0, alias="page_offset"),
    limit: int = Query(100, alias="page_size"),
    collection_name: str = DEFAULT_COLLECTION_NAME,
):
    return JSONResponse(
        content=StandardResponse(
            status="success",
            data=KnowledgeBaseService.retrieve(collection_name),
        ).dict(),
        status_code=200,
    )
