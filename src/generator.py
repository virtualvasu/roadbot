# src/generator.py

import os
import requests
import json
from dotenv import load_dotenv
from typing import List, Tuple, Optional

from .qdrant_retriever import QdrantRetriever

# 🔐 Load environment variables from .env file
load_dotenv()

class Generator:
    def __init__(self, model_name: str = None):
        """
        Initializes the Hugging Face Router API client and the retriever.
        """
        # Load Qdrant configuration
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        
        if not qdrant_url or not qdrant_api_key:
            raise ValueError("QDRANT_URL and QDRANT_API_KEY environment variables must be set")
        
        # Initialize Qdrant retriever
        self.retriever = QdrantRetriever(
            url=qdrant_url,
            api_key=qdrant_api_key
        )
        print("Using Qdrant Cloud vector database")

        # Available working models from HF Router API
        self.available_models = [
            "meta-llama/Llama-3.1-8B-Instruct",  # Works with multiple providers
            "Qwen/Qwen2.5-7B-Instruct",          # Good for chat
            "meta-llama/Meta-Llama-3-8B-Instruct", # Stable option
            "openai/gpt-oss-20b"                 # Higher capacity
        ]
        
        self.model_name = model_name if model_name else self.available_models[0]
        
        # API configuration 
        self.api_key = os.getenv("HF_TOKEN")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.hf_router_url = "https://router.huggingface.co/v1/chat/completions"
        self.openai_base_url = "https://api.openai.com/v1/chat/completions"
        
        if not self.api_key and not self.openai_api_key:
            raise ValueError("Either HF_TOKEN or OPENAI_API_KEY environment variable must be set")

    def ask(self, query: str, top_k: int = 10, document_ids: Optional[List[str]] = None) -> Tuple[str, List[str]]:
        """
        Uses retriever to find context and generates an answer using available APIs.
        
        Args:
            query: User's question
            top_k: Number of relevant chunks to retrieve
            document_ids: Optional list of specific document IDs to search within
            
        Returns:
            Tuple of (answer, list of document filenames used)
        """
        try:
            # Retrieve top-k relevant chunks
            print(f"Querying retriever for: {query}")
            relevant_chunks = self.retriever.query(query, top_k)
            print(f"Retrieved {len(relevant_chunks)} chunks")
            
            # Filter chunks by document IDs if specified
            if document_ids:
                relevant_chunks = [
                    chunk for chunk in relevant_chunks 
                    if chunk.get('document_id') in document_ids
                ]
                print(f"Filtered to {len(relevant_chunks)} chunks from specified documents")
            
            # Extract context and track document sources
            context = "\n\n".join([chunk["text"] for chunk in relevant_chunks])
            
            # Get unique document filenames used
            documents_used = list(set([
                chunk.get('filename', 'Unknown Document') 
                for chunk in relevant_chunks 
                if 'filename' in chunk
            ]))
            
            # If no documents specified in chunks, use legacy format
            if not documents_used and relevant_chunks:
                documents_used = ['Tamil Nadu Traffic Rules']

            # Try different approaches based on available APIs
            if self.openai_api_key:
                print("Using OpenAI API...")
                answer = self._call_openai_api(context, query)
            else:
                print("Using Hugging Face Router API...")
                answer = self._call_huggingface_router_api(context, query)
            
            return answer, documents_used
                
        except Exception as e:
            print(f"Error in ask method: {type(e).__name__}: {str(e)}")
            raise

    def _call_openai_api(self, context: str, query: str) -> str:
        """Call OpenAI API."""
        system_content = (
            "You are a document assistant that helps answer questions based on uploaded documents. "
            "Answer questions using only the provided context from the documents. "
            "If information is not in the context, say it's not available. "
            "Be clear, factual, and cite specific information from the documents when possible. "
            "If the context includes traffic rules, include specific fines (₹) when mentioned."
        )

        payload = {
            "messages": [
                {"role": "system", "content": system_content},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
            ],
            "model": "gpt-3.5-turbo",
            "temperature": 0.3,
            "max_tokens": 500
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.openai_api_key}"
        }

        response = requests.post(self.openai_base_url, headers=headers, json=payload, timeout=60)
        
        if response.status_code == 200:
            response_data = response.json()
            return response_data['choices'][0]['message']['content']
        else:
            raise Exception(f"OpenAI API error {response.status_code}: {response.text}")

    def _call_huggingface_router_api(self, context: str, query: str) -> str:
        """Call Hugging Face Router API with working models."""
        
        system_content = (
            "You are a document assistant that helps answer questions based on uploaded documents. "
            "Answer questions using only the provided context from the documents. "
            "If information is not in the context, say it's not available. "
            "Be clear, factual, and cite specific information from the documents when possible. "
            "If the context includes traffic rules, include specific fines (₹) when mentioned."
        )

        models_to_try = [self.model_name] + [m for m in self.available_models if m != self.model_name]
        
        for model in models_to_try:
            try:
                print(f"Trying model: {model}")
                
                payload = {
                    "messages": [
                        {"role": "system", "content": system_content},
                        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
                    ],
                    "model": model,
                    "temperature": 0.3,
                    "max_tokens": 500
                }

                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }

                response = requests.post(self.hf_router_url, headers=headers, json=payload, timeout=60)
                
                if response.status_code == 200:
                    response_data = response.json()
                    print(f"Successfully got response from {model}")
                    self.model_name = model  # Update to working model
                    return response_data['choices'][0]['message']['content']
                else:
                    print(f"Model {model} failed with status {response.status_code}: {response.text}")
                    continue
                    
            except Exception as e:
                print(f"Model {model} failed with error: {str(e)}")
                continue
        
        # If all models fail, return a basic response using context
        print("All models failed, returning basic context-based response...")
        return self._basic_context_response(context, query)

    def _basic_context_response(self, context: str, query: str) -> str:
        """Fallback method that provides a basic response using context matching."""
        query_lower = query.lower()
        context_lower = context.lower()
        
        # Look for relevant information in context
        relevant_sentences = []
        for sentence in context.split('.'):
            if any(word in sentence.lower() for word in query_lower.split()):
                relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return f"Based on the available documents: {'. '.join(relevant_sentences[:3])}."
        else:
            return "I couldn't find specific information about your query in the available documents."

if __name__ == "__main__":
    generator = Generator()
    query = "What are the rules for overtaking?"
    answer, documents_used = generator.ask(query)
    print("\nAnswer:\n")
    print(answer)
    print(f"\nDocuments used: {documents_used}")
