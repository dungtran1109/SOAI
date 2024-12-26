import os

from chromadb.config import Settings
from langchain_community.document_loaders import CSVLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.document_loaders import TextLoader
from langchain_community.document_loaders import UnstructuredExcelLoader
from langchain_community.document_loaders import Docx2txtLoader
from langchain_community.document_loaders import UnstructuredFileLoader
from langchain_community.document_loaders import UnstructuredMarkdownLoader

ROOT_DIRECTORY = os.path.dirname(os.path.realpath(__name__))

SOURCE_DIRECTORY = f"{ROOT_DIRECTORY}/.DOCS"

PERSIST_DIRECTORY = f"{ROOT_DIRECTORY}/.DB"

# Can be changed to a specific number
INGEST_THREADS = os.cpu_count() or 8

DOCUMENT_MAP = {
    ".txt": TextLoader,
    ".md": UnstructuredMarkdownLoader,
    ".py": TextLoader,
    ".pdf": PyPDFLoader,
    # ".pdf": UnstructuredFileLoader,
    ".csv": CSVLoader,
    ".xls": UnstructuredExcelLoader,
    ".xlsx": UnstructuredExcelLoader,
    ".docx": Docx2txtLoader,
    ".doc": Docx2txtLoader,
}

CHROMA_SETTINGS = Settings(
    anonymized_telemetry=False,
    is_persistent=True,
)
