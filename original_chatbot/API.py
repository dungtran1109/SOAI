from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List
from rag import RAG
from constants import SOURCE_DIRECTORY, DOCUMENT_MAP
from utils import list_file_names, create_source_dir

app = FastAPI(title="DEK Chatbot API")

# Enable CORS (if required for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize session state and assistant variables
session_state = {"messages": [], "assistant": None, "selected_llm": None}

# Initialize the source directory
create_source_dir(SOURCE_DIRECTORY)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    references: List[str]


@app.post("/select-model/")
def select_model(model: str = Form(...)):
    """Selects the LLM model to use."""
    if model not in ["phi3", "llama2", "llama3"]:
        raise HTTPException(status_code=400, detail="Invalid model selection")

    session_state["selected_llm"] = model
    session_state["assistant"] = RAG(model)
    return {"message": f"Model '{model}' selected successfully."}


@app.post("/upload/")
def upload_file(files: List[UploadFile]):
    """Uploads documents for ingestion."""
    uploaded_files = []
    existing_files = list_file_names(SOURCE_DIRECTORY)

    for file in files:
        if file.filename in existing_files:
            continue

        file_path = os.path.join(SOURCE_DIRECTORY, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        uploaded_files.append(file.filename)

    return {"uploaded": uploaded_files, "message": "Files uploaded successfully."}


@app.post("/ingest/")
def ingest_documents():
    """Ingests uploaded documents into the assistant."""
    if not session_state["assistant"]:
        raise HTTPException(status_code=400, detail="No model selected")

    session_state["assistant"].ingest_docs_from_source_dir()
    return {"message": "Documents ingested successfully."}


@app.post("/chat/", response_model=ChatResponse)
def chat(chat_request: ChatRequest):
    """Processes a chat message and returns a response."""
    if not session_state.get("assistant"):
        raise HTTPException(status_code=400, detail="Assistant is not initialized. Please select a model first.")

    message = chat_request.message
    session_state["messages"].append({"role": "user", "content": message})

    response = session_state["assistant"].ask(message)
    agent_response = response["answer"]
    references = [ref.page_content for ref in response["context"] if ref.page_content.strip()]

    session_state["messages"].append({"role": "assistant", "content": agent_response})

    return ChatResponse(response=agent_response, references=references)


@app.get("/files/")
def list_uploaded_files():
    """Lists uploaded files."""
    files = list_file_names(SOURCE_DIRECTORY)
    return {"files": files}


@app.get("/")
def root():
    return {"message": "Welcome to the DEK Chatbot API!"}