from typing import Any, Dict, List, Sequence
from uuid import UUID
from langchain_core.callbacks.base import BaseCallbackHandler
from datetime import datetime

from langchain_core.documents import Document
from langchain_core.outputs import LLMResult

def get_current_time_str():
    c = datetime.now()
    return c.strftime('%H:%M:%S')

class CallbackLogger(BaseCallbackHandler):
    # def on_chain_start(self, serialized: Dict[str, Any], inputs: Dict[str, Any], *, run_id: UUID, parent_run_id: UUID | None = None, tags: List[str] | None = None, metadata: Dict[str, Any] | None = None, **kwargs: Any) -> Any:
    #     print(["start", run_id, get_current_time_str()])

    # def on_chain_end(self, outputs: Dict[str, Any], *, run_id: UUID, parent_run_id: UUID | None = None, **kwargs: Any) -> Any:
    #     print(["end", run_id, get_current_time_str()])

    def __init__(self, logger):
        self.logger = logger

    def on_retriever_start(self, serialized: Dict[str, Any], query: str, *, run_id: UUID, parent_run_id: UUID | None = None, tags: List[str] | None = None, metadata: Dict[str, Any] | None = None, **kwargs: Any) -> Any:
        self.logger.start('retriever')
        print('retriever start')
    
    def on_retriever_end(self, documents: Sequence[Document], *, run_id: UUID, parent_run_id: UUID | None = None, **kwargs: Any) -> Any:
        self.logger.stop('retriever')
        print('retriever stop')

    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], *, run_id: UUID, parent_run_id: UUID | None = None, tags: List[str] | None = None, metadata: Dict[str, Any] | None = None, **kwargs: Any) -> Any:
        self.logger.start('llm')
        print('llm start')
    
    def on_llm_end(self, response: LLMResult, *, run_id: UUID, parent_run_id: UUID | None = None, **kwargs: Any) -> Any:
        self.logger.stop('llm')
        print('llm stop')

    def on_llm_error(self, error):
        print('llm error')
        print(error)
