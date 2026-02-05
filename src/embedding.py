import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer

def load_chunks(json_path: str):
    """Loads text chunks from a JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_embeddings(texts: list[str], model_name='all-MiniLM-L6-v2') -> np.ndarray:
    """Generates embeddings using a pre-trained SentenceTransformer."""
    model = SentenceTransformer(model_name)
    embeddings = model.encode(texts, show_progress_bar=True)
    return np.array(embeddings)
