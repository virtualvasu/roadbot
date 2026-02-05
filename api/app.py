from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from src.generator import Generator

app = FastAPI(
    title="Traffic Rules RAG API",
    description="A RAG-based assistant for Tamil Nadu traffic rules using Groq + Qdrant Cloud",
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

@app.on_event("startup")
async def startup_event():
    global generator
    try:
        print("Initializing Generator...")
        generator = Generator()
        print("Generator initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize services: {e}")
        generator = None

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10
    document_ids: Optional[List[str]] = None  # Specific documents to query

class QueryResponse(BaseModel):
    answer: str
    documents_used: List[str] = []

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tamil Nadu Traffic Rules RAG API!"}

@app.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    if generator is None:
        raise HTTPException(status_code=503, detail="Services not initialized. Please check server logs.")
    
    try:
        answer, documents_used = generator.ask(request.query, top_k=request.top_k, document_ids=request.document_ids)
        return {"answer": answer, "documents_used": documents_used}
    except Exception as e:
        print(f"Error in /ask endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Health check endpoint"""
    if generator is None:
        return {"status": "unhealthy", "message": "Services not initialized"}
    return {"status": "healthy", "message": "All services are running"}
