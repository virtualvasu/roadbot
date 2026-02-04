from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from src.generator import Generator

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

@app.on_event("startup")
async def startup_event():
    global generator
    try:
        print("Initializing Generator...")
        generator = Generator()
        print("Generator initialized successfully!")
    except Exception as e:
        print(f"Failed to initialize Generator: {e}")
        generator = None

class QueryRequest(BaseModel):
    query: str
    top_k: int = 10

class QueryResponse(BaseModel):
    answer: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tamil Nadu Traffic Rules RAG API!"}

@app.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    if generator is None:
        raise HTTPException(status_code=503, detail="Generator not initialized. Please check server logs.")
    
    try:
        answer = generator.ask(request.query, top_k=request.top_k)
        return {"answer": answer}
    except Exception as e:
        print(f"Error in /ask endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
