# src/qdrant_retriever.py

import os
import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from .qdrant_vector_store import QdrantVectorStore

class QdrantRetriever:
    def __init__(self, url: str = None, api_key: str = None, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize Qdrant retriever with cloud connection"""
        self.vector_store = QdrantVectorStore(url=url, api_key=api_key)
        self.model = SentenceTransformer(model_name)
        print(f"QdrantRetriever initialized with model: {model_name}")
    
    def query(self, question: str, top_k: int = 10, document_ids: Optional[List[str]] = None) -> List[Dict]:
        """
        Query the Qdrant vector store for relevant chunks
        
        Args:
            question: User question
            top_k: Number of results to return
            document_ids: Optional list of document IDs to filter by
            
        Returns:
            List of relevant chunks with metadata
        """
        try:
            # Generate embedding for the question
            question_embedding = self.model.encode([question])[0]
            
            # Search in Qdrant
            results = self.vector_store.search(
                query_vector=question_embedding,
                top_k=top_k,
                document_ids=document_ids
            )
            
            print(f"Found {len(results)} relevant chunks for query: '{question[:50]}...'")
            return results
            
        except Exception as e:
            print(f"Error in query: {str(e)}")
            return []
    
    def get_collection_stats(self) -> Dict:
        """Get statistics about the vector collection"""
        return self.vector_store.get_collection_info()

# For testing
if __name__ == "__main__":
    url = "https://d3a59b1a-2c08-479c-a136-66a2093ca9c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
    api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.VMdma7WGzPTcBsiuH56eAk2wzt_b347i8kh5XjSzz-U"
    
    retriever = QdrantRetriever(url=url, api_key=api_key)
    
    # Test query
    results = retriever.query("What is the fine for not wearing a helmet?", top_k=3)
    
    print("\nSearch Results:")
    for i, result in enumerate(results, 1):
        print(f"\n[Result {i}] Score: {result['score']:.3f}")
        print(f"Text: {result['text'][:100]}...")
        print(f"Document: {result['filename']}")