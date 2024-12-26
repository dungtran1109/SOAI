import logging
import os

from langchain_community.vectorstores.chroma import Chroma
from langchain_core.callbacks import StdOutCallbackHandler
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings.ollama import OllamaEmbeddings
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnableConfig, RunnablePassthrough
from langchain.prompts import PromptTemplate
from langchain.vectorstores.utils import filter_complex_metadata
from constants import CHROMA_SETTINGS, PERSIST_DIRECTORY, SOURCE_DIRECTORY
from ingest import RAGIngest
from callback_logger import CallbackLogger
from performance_logger import PerformanceLogger
from langchain.globals import set_debug
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers import ContextualCompressionRetriever
from semantic_chunking_helper import SematicChunkingHelper
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.document_loaders import PDFPlumberLoader, DirectoryLoader
from langchain_core.runnables import RunnableParallel

set_debug(True)

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__file__)
performance_logger = PerformanceLogger()


def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)


class RAG:
    """RAG Class Helper"""

    vector_store = None
    retriever = None
    chain = None
    persist_dir = None

    def __init__(self, model_name):
        self.model_name = model_name
        self.model = ChatOllama(model=model_name)
        self.persist_dir = PERSIST_DIRECTORY + "_" + model_name
        logger.info("persistent_dir: %s", self.persist_dir)
        self.prompt = PromptTemplate.from_template(
            """
            <s> [INST] You are a DEK helpful assistant, \
            your job is answering question about DEK policy documents. \
            Do not give me any information that is not metioned in PROVIDED CONTEXT. \
            If you don't know just say that you don't know. [/INST] </s> 
            [INST] Question: {question} 
            Context: {context} 
            Answer: [/INST]
            """
        )

    def ingest_docs_from_source_dir(self, source_dir=SOURCE_DIRECTORY):
        """Ingest docs from source dir"""
        logger.info("Ingest with model: %s", self.model_name)
        # docs = RAGIngest.load_documents(source_dir)
        # PyPDFDirectoryLoader, supports loading dpf files
        docs = DirectoryLoader(
            source_dir, glob="**/*.pdf", loader_cls=PDFPlumberLoader
        ).load()
        chunks = filter_complex_metadata(docs)

        embeddings = HuggingFaceInstructEmbeddings(
            model_name="hkunlp/instructor-large",
            model_kwargs={"device": "cpu"},
        )

        semantic_chunking = SematicChunkingHelper(
            docs=chunks, embeddings=embeddings, buffer_size=2, breakpoint_threshold=50
        )

        Chroma.from_texts(
            texts=semantic_chunking.text_chunks,
            embedding=embeddings,
            client_settings=CHROMA_SETTINGS,
            persist_directory=self.persist_dir,
        )

    def load_retriever(self):
        if self.retriever is not None:
            return True

        if not os.path.exists(self.persist_dir):
            return False

        embeddings = HuggingFaceInstructEmbeddings(
            model_name="hkunlp/instructor-large",
            model_kwargs={"device": "cpu"},
        )

        vector_store = Chroma(
            persist_directory=self.persist_dir,
            embedding_function=embeddings,
            client_settings=CHROMA_SETTINGS,
        )

        base_retriever = vector_store.as_retriever(search_kwargs={"k": 10})
        model = HuggingFaceCrossEncoder(model_name="BAAI/bge-reranker-base")
        reranker = CrossEncoderReranker(model=model, top_n=2)
        self.retriever = ContextualCompressionRetriever(
            base_compressor=reranker, base_retriever=base_retriever
        )

        chain_from_docs = (
            RunnablePassthrough.assign(context=(lambda x: format_docs(x["context"])))
            | self.prompt
            | self.model
            | StrOutputParser()
        )

        self.chain = RunnableParallel(
            {"context": self.retriever, "question": RunnablePassthrough()}
        ).assign(answer=chain_from_docs)

        return True

    def filter_answer_from_response(self, response: dict):
        """filter_answer_from_response"""
        if response["answer"] or len(response["answer"]) > 0:
            response["answer"] = response["answer"].replace("</s> [INST]", "")
            response["answer"] = response["answer"].replace("</s>", "")
            response["answer"] = response["answer"].replace("<s>", "")
            response["answer"] = response["answer"].replace("[ANSW]", "")
            response["answer"] = response["answer"].replace("[ANS]", "")
            response["answer"] = response["answer"].replace("[/ANSW]", "")
            response["answer"] = response["answer"].replace("[INST]", "")
            response["answer"] = response["answer"].replace("[/INST]", "")

    def ask(self, query: str):
        """Retrieve answer from LLM"""
        if not self.chain:
            return "Please, add a document first."

        performance_logger.open(query, model=self.model_name)
        callback_handler = CallbackLogger(logger=performance_logger)
        config = {"callbacks": [callback_handler]}

        result = self.chain.invoke(query, config=config)
        performance_logger.close(result)

        self.filter_answer_from_response(result)

        return result

    def clear(self):
        """Clear"""
        self.vector_store = None
        self.retriever = None
        self.chain = None
