# src/qdrant_vector_store.py

import os
import uuid
import time
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import numpy as np

class QdrantVectorStore:
    def __init__(self, url: str = None, api_key: str = None):
        """Initialize Qdrant client with cloud or local connection"""
        if url and api_key:
            # Cloud connection with increased timeout and retry parameters
            self.client = QdrantClient(
                url=url, 
                api_key=api_key,
                timeout=120,  # Increase timeout to 120 seconds
                # Add additional connection parameters for reliability
                prefer_grpc=False,  # Use REST API for better timeout handling
            )
        else:
            # Local connection (fallback)
            self.client = QdrantClient(host="localhost", port=6333, timeout=120)
        
        self.collection_name = "traffic_rules"
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create collection if it doesn't exist"""
        try:
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 embedding size
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection: {self.collection_name}")
            else:
                print(f"Collection {self.collection_name} already exists")
        except Exception as e:
            print(f"Error ensuring collection: {str(e)}")
            raise
    
    def add_document_chunks(self, chunks: List[Dict], embeddings: np.ndarray, document_id: str, filename: str):
        """Add chunks from a document with metadata, using retry logic and batch processing"""
        points = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(PointStruct(
                id=point_id,
                vector=embedding.tolist(),
                payload={
                    "text": chunk["text"],
                    "document_id": document_id,
                    "chunk_id": chunk.get("chunk_id", i),
                    "filename": filename,
                    "upload_date": chunk.get("upload_date", ""),
                    "page_number": chunk.get("page_number", 1)
                }
            ))
        
        # Process in batches to avoid timeouts with large documents
        batch_size = 50  # Reduce batch size for more reliable uploads
        total_batches = (len(points) + batch_size - 1) // batch_size
        
        for batch_idx in range(total_batches):
            start_idx = batch_idx * batch_size
            end_idx = min(start_idx + batch_size, len(points))
            batch_points = points[start_idx:end_idx]
            
            # Retry logic with exponential backoff
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    self.client.upsert(
                        collection_name=self.collection_name,
                        points=batch_points,
                        wait=True  # Wait for operation to complete
                    )
                    print(f"Added batch {batch_idx + 1}/{total_batches} ({len(batch_points)} chunks) for document {document_id}")
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    wait_time = (2 ** attempt) * 5  # Exponential backoff: 5s, 10s, 20s
                    print(f"Attempt {attempt + 1} failed for batch {batch_idx + 1}: {str(e)}")
                    
                    if attempt < max_retries - 1:
                        print(f"Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        print(f"Failed to add batch {batch_idx + 1} after {max_retries} attempts")
                        return False
        
        print(f"Successfully added all {len(points)} chunks for document {document_id}")
        return True
    
    def search(self, query_vector: np.ndarray, top_k: int = 10, document_ids: Optional[List[str]] = None) -> List[Dict]:
        """Search with optional document filtering"""
        query_filter = None
        
        if document_ids:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(any=document_ids)
                    )
                ]
            )
        
        try:
            results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector.tolist(),
                limit=top_k,
                query_filter=query_filter
            )
            
            # Handle the response format properly
            if hasattr(results, 'points'):
                points = results.points
            else:
                points = results
                
            return [{
                "text": point.payload["text"],
                "chunk_id": point.payload["chunk_id"],
                "score": point.score,
                "document_id": point.payload["document_id"],
                "filename": point.payload.get("filename", ""),
                "page_number": point.payload.get("page_number", 1)
            } for point in points]
        except Exception as e:
            print(f"Error searching: {str(e)}")
            return []
    
    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks from a document"""
        try:
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=filter_condition
            )
            print(f"Deleted all chunks for document {document_id}")
            return True
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            return False
    
    def get_document_count(self, document_id: str) -> int:
        """Get number of chunks for a document"""
        try:
            filter_condition = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id)
                    )
                ]
            )
            
            result = self.client.count(
                collection_name=self.collection_name,
                count_filter=filter_condition
            )
            return result.count
        except Exception as e:
            print(f"Error counting document chunks: {str(e)}")
            return 0
    
    def get_collection_info(self) -> Dict:
        """Get collection statistics"""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "total_points": info.points_count,
                "vector_size": info.config.params.vectors.size,
                "distance": info.config.params.vectors.distance
            }
        except Exception as e:
            print(f"Error getting collection info: {str(e)}")
            return {}

# Test the connection
if __name__ == "__main__":
    # Test with your cloud credentials
    url = "https://d3a59b1a-2c08-479c-a136-66a2093ca9c3.europe-west3-0.gcp.cloud.qdrant.io:6333"
    api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.VMdma7WGzPTcBsiuH56eAk2wzt_b347i8kh5XjSzz-U"
    
    try:
        vector_store = QdrantVectorStore(url=url, api_key=api_key)
        info = vector_store.get_collection_info()
        print(f"Connected to Qdrant Cloud! Collection info: {info}")
    except Exception as e:
        print(f"Connection failed: {str(e)}")