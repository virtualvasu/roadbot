# src/migrate_to_qdrant.py

import os
import json
import sys
from pathlib import Path

# Add src to path to import modules
sys.path.append(str(Path(__file__).parent))

from qdrant_vector_store import QdrantVectorStore
from embedding import generate_embeddings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_existing_data():
    """Migrate existing FAISS data to Qdrant"""
    
    # Get Qdrant connection details
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    if not qdrant_url or not qdrant_api_key:
        print("❌ Error: QDRANT_URL and QDRANT_API_KEY environment variables must be set")
        return False
    
    try:
        # Initialize Qdrant vector store
        print("🔗 Connecting to Qdrant...")
        vector_store = QdrantVectorStore(url=qdrant_url, api_key=qdrant_api_key)
        
        # Path to existing data
        base_dir = Path(__file__).parent.parent
        chunks_file = base_dir / "data" / "processed" / "TN_traffic_rules_chunks.json"
        
        if not chunks_file.exists():
            print(f"❌ No existing chunks file found at {chunks_file}")
            return False
            
        # Load existing chunks
        print("📄 Loading existing chunks...")
        with open(chunks_file, 'r', encoding='utf-8') as f:
            chunks = json.load(f)
            
        if not chunks:
            print("❌ No chunks found in the file")
            return False
            
        print(f"📊 Found {len(chunks)} chunks to migrate")
        
        # Generate embeddings
        print("🧠 Generating embeddings...")
        texts = [chunk["text"] for chunk in chunks]
        embeddings = generate_embeddings(texts)
        
        # Add to Qdrant in smaller batches with retries
        print("⬆️ Uploading to Qdrant in small batches...")
        batch_size = 10
        total_chunks = len(chunks)
        max_retries = 3
        
        for i in range(0, total_chunks, batch_size):
            batch_chunks = chunks[i:i+batch_size]
            batch_embeddings = embeddings[i:i+batch_size]
            
            print(f"   Uploading batch {i//batch_size + 1}/{(total_chunks + batch_size - 1)//batch_size}...")
            
            # Retry logic
            for retry in range(max_retries):
                try:
                    success = vector_store.add_document_chunks(
                        batch_chunks, 
                        batch_embeddings, 
                        "original_tn_rules", 
                        "TN_traffic_rules.txt"
                    )
                    
                    if success:
                        break
                    elif retry == max_retries - 1:
                        print(f"❌ Failed to upload batch {i//batch_size + 1} after {max_retries} retries")
                        return False
                except Exception as e:
                    print(f"   Retry {retry + 1}/{max_retries} for batch {i//batch_size + 1}: {str(e)}")
                    if retry == max_retries - 1:
                        print(f"❌ Failed to upload batch {i//batch_size + 1} after {max_retries} retries")
                        return False
                    import time
                    time.sleep(2)  # Wait 2 seconds before retry
        
        print(f"✅ Successfully migrated {len(chunks)} chunks to Qdrant!")
        
        # Get collection stats
        stats = vector_store.get_collection_info()
        print(f"📈 Collection stats: {stats}")
        return True
            
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        return False

def verify_migration():
    """Verify the migration by testing a search"""
    try:
        from qdrant_retriever import QdrantRetriever
        
        # Get Qdrant connection details
        qdrant_url = os.getenv("QDRANT_URL")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")
        
        print("\n🔍 Testing search functionality...")
        retriever = QdrantRetriever(url=qdrant_url, api_key=qdrant_api_key)
        
        # Test query
        results = retriever.query("What is the fine for not wearing helmet?", top_k=3)
        
        if results:
            print(f"✅ Search test successful! Found {len(results)} relevant results")
            print("\n📋 Sample result:")
            print(f"Text: {results[0]['text'][:100]}...")
            print(f"Score: {results[0]['score']:.3f}")
            return True
        else:
            print("❌ Search test failed - no results found")
            return False
            
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting FAISS to Qdrant migration...\n")
    
    # Step 1: Migrate data
    if migrate_existing_data():
        print("\n" + "="*50)
        
        # Step 2: Verify migration
        if verify_migration():
            print("\n🎉 Migration completed successfully!")
            print("\n✅ Your system is now using Qdrant Cloud vector database")
            print("✅ FAISS files can be safely removed if desired")
            print("✅ All new documents will be automatically added to Qdrant")
        else:
            print("\n⚠️ Migration completed but verification failed")
    else:
        print("\n❌ Migration failed")