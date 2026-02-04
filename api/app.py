from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import shutil
import uuid
from datetime import datetime
from src.generator import Generator
from src.document_manager import DocumentManager

app = FastAPI(
    title="Traffic Rules RAG API",
    description="A RAG-based assistant for Tamil Nadu traffic rules using Groq + FAISS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

generator = None
document_manager = None

@app.on_event("startup")
async def startup_event():
    global generator, document_manager
    try:
        print("Initializing Document Manager...")
        document_manager = DocumentManager()
        print("Initializing Generator...")
        generator = Generator()
        print("Generator and Document Manager initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize services: {e}")
        generator = None
        document_manager = None

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10
    document_ids: Optional[List[str]] = None  # Specific documents to query

class QueryResponse(BaseModel):
    answer: str
    documents_used: List[str] = []

class DocumentInfo(BaseModel):
    id: str
    filename: str
    upload_date: str
    file_size: int
    status: str
    chunk_count: int = 0

class UploadResponse(BaseModel):
    success: bool
    document_id: str
    filename: str
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tamil Nadu Traffic Rules RAG API!"}

@app.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    if generator is None or document_manager is None:
        raise HTTPException(status_code=503, detail="Services not initialized. Please check server logs.")
    
    try:
        answer, documents_used = generator.ask(request.query, top_k=request.top_k, document_ids=request.document_ids)
        return {"answer": answer, "documents_used": documents_used}
    except Exception as e:
        print(f"Error in /ask endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    if document_manager is None:
        raise HTTPException(status_code=503, detail="Document manager not initialized.")
    
    # Validate file type
    allowed_types = ['.pdf', '.txt', '.docx']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum size is 10MB.")
    
    try:
        # Generate unique document ID
        document_id = str(uuid.uuid4())
        
        # Save and process document
        success, message = await document_manager.add_document(
            document_id=document_id,
            filename=file.filename,
            content=file_content,
            file_extension=file_extension
        )
        
        if success:
            return UploadResponse(
                success=True,
                document_id=document_id,
                filename=file.filename,
                message=message
            )
        else:
            raise HTTPException(status_code=500, detail=message)
            
    except Exception as e:
        print(f"Error in upload endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents", response_model=List[DocumentInfo])
def list_documents():
    if document_manager is None:
        raise HTTPException(status_code=503, detail="Document manager not initialized.")
    
    try:
        documents = document_manager.list_documents()
        return documents
    except Exception as e:
        print(f"Error in list documents endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
def delete_document(document_id: str):
    if document_manager is None:
        raise HTTPException(status_code=503, detail="Document manager not initialized.")
    
    try:
        success, message = document_manager.delete_document(document_id)
        if success:
            return {"success": True, "message": message}
        else:
            raise HTTPException(status_code=404, detail=message)
    except Exception as e:
        print(f"Error in delete document endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/rebuild-index")
def rebuild_index():
    if document_manager is None:
        raise HTTPException(status_code=503, detail="Document manager not initialized.")
    
    try:
        success, message = document_manager.rebuild_index()
        if success:
            # Reinitialize generator with new index
            global generator
            generator = Generator()
            return {"success": True, "message": message}
        else:
            raise HTTPException(status_code=500, detail=message)
    except Exception as e:
        print(f"Error in rebuild index endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
