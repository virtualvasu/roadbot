# src/document_manager.py

import os
import json
import shutil
import asyncio
from datetime import datetime
from typing import List, Tuple, Optional, Dict
import uuid
from pathlib import Path

from .text_extraction import extract_text_from_file
from .chunking import chunk_text
from .embedding import generate_embeddings, save_faiss_index


class DocumentManager:
    def __init__(self, base_dir: str = None):
        """Initialize the document manager with storage paths."""
        if base_dir is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        
        self.base_dir = base_dir
        self.uploads_dir = os.path.join(base_dir, "data", "uploads")
        self.processed_dir = os.path.join(base_dir, "data", "processed")
        self.documents_dir = os.path.join(self.processed_dir, "documents")
        self.metadata_file = os.path.join(self.processed_dir, "documents_metadata.json")
        
        # Create directories if they don't exist
        os.makedirs(self.uploads_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.documents_dir, exist_ok=True)
        
        # Initialize metadata file if it doesn't exist
        if not os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump({}, f)
    
    def _load_metadata(self) -> Dict:
        """Load document metadata from file."""
        try:
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_metadata(self, metadata: Dict):
        """Save document metadata to file."""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    async def add_document(self, document_id: str, filename: str, content: bytes, file_extension: str) -> Tuple[bool, str]:
        """
        Add a new document to the system.
        
        Args:
            document_id: Unique identifier for the document
            filename: Original filename
            content: File content as bytes
            file_extension: File extension (.pdf, .txt, .docx)
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        try:
            # Save uploaded file
            uploaded_file_path = os.path.join(self.uploads_dir, f"{document_id}{file_extension}")
            with open(uploaded_file_path, 'wb') as f:
                f.write(content)
            
            # Extract text based on file type
            try:
                if file_extension.lower() == '.txt':
                    text = content.decode('utf-8', errors='ignore')
                else:
                    text = extract_text_from_file(uploaded_file_path)
            except Exception as e:
                return False, f"Error extracting text: {str(e)}"
            
            if not text.strip():
                return False, "No readable text found in the document"
            
            # Save extracted text
            text_file_path = os.path.join(self.documents_dir, f"{document_id}.txt")
            with open(text_file_path, 'w', encoding='utf-8') as f:
                f.write(text)
            
            # Generate chunks
            chunks = chunk_text(text, chunk_size=500, overlap=50)
            
            # Save chunks with document metadata
            chunks_with_metadata = [
                {
                    "text": chunk,
                    "document_id": document_id,
                    "chunk_index": i,
                    "filename": filename
                }
                for i, chunk in enumerate(chunks)
            ]
            
            chunks_file_path = os.path.join(self.documents_dir, f"{document_id}_chunks.json")
            with open(chunks_file_path, 'w', encoding='utf-8') as f:
                json.dump(chunks_with_metadata, f, indent=2, ensure_ascii=False)
            
            # Update metadata
            metadata = self._load_metadata()
            metadata[document_id] = {
                "filename": filename,
                "upload_date": datetime.now().isoformat(),
                "file_size": len(content),
                "file_extension": file_extension,
                "status": "processed",
                "chunk_count": len(chunks),
                "text_file": text_file_path,
                "chunks_file": chunks_file_path,
                "uploaded_file": uploaded_file_path
            }
            self._save_metadata(metadata)
            
            # Rebuild the combined index
            await asyncio.get_event_loop().run_in_executor(None, self._rebuild_combined_index)
            
            return True, f"Document '{filename}' processed successfully with {len(chunks)} chunks"
            
        except Exception as e:
            print(f"Error processing document {document_id}: {str(e)}")
            return False, f"Error processing document: {str(e)}"
    
    def _rebuild_combined_index(self):
        """Rebuild the FAISS index with all documents."""
        try:
            metadata = self._load_metadata()
            all_chunks = []
            
            # Collect all chunks from all documents
            for doc_id, doc_info in metadata.items():
                if doc_info["status"] == "processed" and os.path.exists(doc_info["chunks_file"]):
                    with open(doc_info["chunks_file"], 'r', encoding='utf-8') as f:
                        chunks = json.load(f)
                        all_chunks.extend(chunks)
            
            if not all_chunks:
                print("No chunks found for index building")
                return
            
            # Generate embeddings for all chunks
            texts = [chunk["text"] for chunk in all_chunks]
            embeddings = generate_embeddings(texts)
            
            # Save combined index
            combined_index_path = os.path.join(self.processed_dir, "combined_faiss_index.idx")
            save_faiss_index(embeddings, combined_index_path)
            
            # Save combined chunks
            combined_chunks_path = os.path.join(self.processed_dir, "combined_chunks.json")
            with open(combined_chunks_path, 'w', encoding='utf-8') as f:
                json.dump(all_chunks, f, indent=2, ensure_ascii=False)
            
            print(f"Combined index rebuilt with {len(all_chunks)} chunks from {len(metadata)} documents")
            
        except Exception as e:
            print(f"Error rebuilding combined index: {str(e)}")
    
    def list_documents(self) -> List[Dict]:
        """List all documents with their metadata."""
        metadata = self._load_metadata()
        documents = []
        
        for doc_id, doc_info in metadata.items():
            documents.append({
                "id": doc_id,
                "filename": doc_info["filename"],
                "upload_date": doc_info["upload_date"],
                "file_size": doc_info["file_size"],
                "status": doc_info["status"],
                "chunk_count": doc_info.get("chunk_count", 0)
            })
        
        # Sort by upload date (newest first)
        documents.sort(key=lambda x: x["upload_date"], reverse=True)
        return documents
    
    def delete_document(self, document_id: str) -> Tuple[bool, str]:
        """Delete a document and its associated files."""
        try:
            metadata = self._load_metadata()
            
            if document_id not in metadata:
                return False, "Document not found"
            
            doc_info = metadata[document_id]
            
            # Delete associated files
            files_to_delete = [
                doc_info.get("uploaded_file"),
                doc_info.get("text_file"),
                doc_info.get("chunks_file")
            ]
            
            for file_path in files_to_delete:
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
            
            # Remove from metadata
            del metadata[document_id]
            self._save_metadata(metadata)
            
            # Rebuild index
            self._rebuild_combined_index()
            
            return True, f"Document '{doc_info['filename']}' deleted successfully"
            
        except Exception as e:
            print(f"Error deleting document {document_id}: {str(e)}")
            return False, f"Error deleting document: {str(e)}"
    
    def rebuild_index(self) -> Tuple[bool, str]:
        """Manually rebuild the combined index."""
        try:
            self._rebuild_combined_index()
            return True, "Index rebuilt successfully"
        except Exception as e:
            return False, f"Error rebuilding index: {str(e)}"
    
    def get_document_chunks(self, document_ids: Optional[List[str]] = None) -> List[Dict]:
        """Get chunks for specific documents or all documents."""
        metadata = self._load_metadata()
        all_chunks = []
        
        docs_to_process = document_ids if document_ids else list(metadata.keys())
        
        for doc_id in docs_to_process:
            if doc_id in metadata and metadata[doc_id]["status"] == "processed":
                chunks_file = metadata[doc_id].get("chunks_file")
                if chunks_file and os.path.exists(chunks_file):
                    with open(chunks_file, 'r', encoding='utf-8') as f:
                        chunks = json.load(f)
                        all_chunks.extend(chunks)
        
        return all_chunks