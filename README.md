# Document AI Assistant - Multi-Document RAG System

An intelligent AI-powered assistant built using Retrieval-Augmented Generation (RAG) that provides accurate, context-aware answers based on your uploaded documents. Upload multiple PDFs, text files, or Word documents and get instant answers with source attribution.

## ✨ Features

📁 **Multi-Document Upload** - Support for PDF, TXT, and DOCX files  
🔍 **Intelligent Search** - RAG-powered semantic search with Qdrant Cloud vector database  
⚡ **Real-time Processing** - Automatic document indexing and fast response times  
🎯 **Source Attribution** - Answers include references to source documents  
🗂️ **Document Management** - Upload, delete, and organize your document library  
💬 **Modern Interface** - Professional web UI with drag-and-drop upload  
🔒 **Reliable Answers** - Responses grounded in your uploaded content only  

## 🏗️ Project Structure
```
document_ai_assistant/
├── data/
│   ├── processed/
│   │   ├── (old FAISS indices removed)   # Now using Qdrant Cloud
│   │   ├── combined_chunks.json          # All document chunks
│   │   ├── documents_metadata.json       # Document metadata
│   │   └── documents/                    # Individual document files
│   └── uploads/                          # Uploaded files storage
├── src/
│   ├── __init__.py
│   ├── chunking.py                       # Text chunking logic
│   ├── embedding.py                      # Vector embedding generation
│   ├── generator.py                      # RAG answer generation
│   ├── retriever.py                      # Document retrieval
│   ├── text_extraction.py               # Multi-format text extraction
│   └── document_manager.py              # Document lifecycle management
├── api/
│   └── app.py                           # FastAPI backend
├── frontend/
│   ├── index.html                       # Web interface
│   ├── script.js                        # Frontend functionality
│   └── styles.css                       # Modern styling
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
└── pyproject.toml
```

## 🛠️ Technology Stack

**Backend:**
- Python 3.11+
- FastAPI for REST API with file upload support
- Qdrant Cloud for vector similarity search with cosine similarity
- Sentence Transformers for text embeddings
- HuggingFace Transformers / OpenAI for language generation
- PyPDF2 for PDF text extraction
- python-docx for Word document processing

**Frontend:**
- Vanilla HTML/CSS/JavaScript
- Responsive web interface

**AI/ML:**
- Retrieval-Augmented Generation (RAG) architecture
- Cosine similarity search
- Multiple LLM support (HuggingFace Router API, OpenAI)

## Prerequisites

- Python 3.11 or higher
- HuggingFace API token (free)
- Optional: OpenAI API key for better performance

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/virtualvasu/roadbot.git
cd roadbot
```

2. **Set up environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and add your HuggingFace token
```

4. **Run the application**
```bash
# Start the API server
python api/app.py

# Or use the CLI interface
python src/main.py
```

5. **Open frontend**
Navigate to `frontend/index.html` in your browser or serve it locally.

## Configuration

### Environment Variables

See `.env.example` for all required and optional configuration options.

### Model Configuration

The system supports multiple language models:
- **HuggingFace Models** (default): Llama-3.1-8B-Instruct, Qwen2.5-7B-Instruct
- **OpenAI Models**: GPT-3.5-turbo, GPT-4 (requires API key)

Models are automatically tried in order of preference with fallback support.

## API Usage

### Start the API server:
```bash
python api/app.py
```

### Example API call:
```bash
curl -X POST "http://localhost:8000/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the fine for not wearing a helmet?"}'
```

### API Documentation:
Visit `http://localhost:8000/docs` for interactive Swagger documentation.

## Data Processing Pipeline

1. **Text Extraction**: Extract text from PDF documents
2. **Chunking**: Split text into overlapping semantic chunks
3. **Embedding**: Generate vector embeddings using sentence transformers
4. **Indexing**: Store embeddings in Qdrant Cloud for fast retrieval
5. **Retrieval**: Find relevant chunks for user queries
6. **Generation**: Generate answers using language models

## Performance

- **Retrieval**: ~50-100ms for semantic search
- **Generation**: Varies by model (100-1000ms)
- **Accuracy**: High precision with source attribution
- **Scalability**: Handles 1000+ document chunks efficiently

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Tamil Nadu Government for traffic rules documentation
- HuggingFace for providing excellent ML models and APIs
- Qdrant team for efficient cloud vector search capabilities

## Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Contact the developer (see contact information below)

---

## Developer

**Vasu Garg**
- GitHub: [@virtualvasu](https://github.com/virtualvasu)
- Project: [RoadBot](https://github.com/virtualvasu/roadbot)

---

*Built with ❤️ to make Tamil Nadu traffic rules accessible to everyone*
