// Configuration
const API_BASE_URL = 'http://localhost:8000'; // Change this to your API URL

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const questionInput = document.getElementById('questionInput');
const sendButton = document.getElementById('sendButton');
const loadingOverlay = document.getElementById('loadingOverlay');
const topKSlider = document.getElementById('topKSlider');
const topKValue = document.getElementById('topKValue');
const apiStatus = document.getElementById('apiStatus');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');

// State
let isWaitingForResponse = false;
let uploadedDocuments = [];
let selectedDocuments = [];
let filesToUpload = [];
let isDocumentPanelCollapsed = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check API status
    checkApiStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-resize textarea
    autoResizeTextarea();
    
    // Update character counter
    updateCharacterCounter();
    
    // Load documents
    loadDocuments();
    
    // Setup file upload
    setupFileUpload();
}

function setupEventListeners() {
    // Send button click
    sendButton.addEventListener('click', handleSubmit);
    
    // Enter key to submit (Shift+Enter for new line)
    questionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    });
    
    // Top-K slider
    topKSlider.addEventListener('input', function() {
        topKValue.textContent = this.value;
    });
    
    // Character counter
    questionInput.addEventListener('input', function() {
        updateCharacterCounter();
        autoResizeTextarea();
    });
    
    // Modal close events
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

async function checkApiStatus() {
    const statusElement = apiStatus.querySelector('span');
    const iconElement = apiStatus.querySelector('i');
    
    try {
        statusElement.textContent = 'Checking...';
        apiStatus.className = 'status-indicator';
        
        const response = await fetch(`${API_BASE_URL}/`);
        const data = await response.json();
        
        if (response.ok && data.message) {
            statusElement.textContent = 'Online';
            apiStatus.className = 'status-indicator online';
            iconElement.style.color = '#22c55e';
        } else {
            throw new Error('Unexpected response');
        }
    } catch (error) {
        console.error('API Status Check Error:', error);
        statusElement.textContent = 'Offline';
        apiStatus.className = 'status-indicator offline';
        iconElement.style.color = '#ef4444';
    }
}

function autoResizeTextarea() {
    questionInput.style.height = 'auto';
    questionInput.style.height = Math.min(questionInput.scrollHeight, 120) + 'px';
}

function updateCharacterCounter() {
    const charCounter = document.querySelector('.char-counter');
    const length = questionInput.value.length;
    charCounter.textContent = `${length}/500`;
    
    if (length > 450) {
        charCounter.style.color = '#ef4444';
    } else if (length > 400) {
        charCounter.style.color = '#f59e0b';
    } else {
        charCounter.style.color = '#718096';
    }
}

async function handleSubmit() {
    const question = questionInput.value.trim();
    
    if (!question || isWaitingForResponse) {
        return;
    }
    
    // Validate input
    if (question.length > 500) {
        showError('Question is too long. Please keep it under 500 characters.');
        return;
    }
    
    const topK = parseInt(topKSlider.value);
    
    // Get selected documents for query
    const queryMode = document.querySelector('input[name="queryMode"]:checked').value;
    const documentIds = queryMode === 'selected' ? selectedDocuments : null;
    
    // Add user message to chat
    addMessage(question, 'user');
    
    // Clear input
    questionInput.value = '';
    updateCharacterCounter();
    autoResizeTextarea();
    
    // Show loading
    showLoading(true);
    isWaitingForResponse = true;
    sendButton.disabled = true;
    
    try {
        // Prepare request body
        const requestBody = {
            query: question,
            top_k: topK
        };
        
        if (documentIds && documentIds.length > 0) {
            requestBody.document_ids = documentIds;
        }
        
        // Send request to API
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add bot response to chat with document info
        let responseText = data.answer;
        if (data.documents_used && data.documents_used.length > 0) {
            responseText += `\n\n📚 *Sources: ${data.documents_used.join(', ')}*`;
        }
        
        addMessage(responseText, 'bot');
        
    } catch (error) {
        console.error('API Error:', error);
        
        let errorMessage = 'Sorry, I encountered an error while processing your question. ';
        
        if (error.message.includes('fetch')) {
            errorMessage += 'Please check if the API server is running.';
        } else if (error.message.includes('503')) {
            errorMessage += 'The service is temporarily unavailable. Please try again later.';
        } else if (error.message.includes('500')) {
            errorMessage += 'There was an internal server error. Please try again.';
        } else {
            errorMessage += error.message;
        }
        
        addMessage(errorMessage, 'bot', true);
    } finally {
        showLoading(false);
        isWaitingForResponse = false;
        sendButton.disabled = false;
        questionInput.focus();
    }
}

function addMessage(content, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const messageP = document.createElement('p');
    messageP.textContent = content;
    
    if (isError) {
        messageP.style.background = '#fed7d7';
        messageP.style.color = '#c53030';
        messageP.style.borderLeft = '4px solid #fc8181';
    }
    
    contentDiv.appendChild(messageP);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function askQuestion(question) {
    questionInput.value = question;
    updateCharacterCounter();
    autoResizeTextarea();
    handleSubmit();
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

function showError(message) {
    addMessage(message, 'bot', true);
}

function showModal(content) {
    modalBody.innerHTML = content;
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function showApiInfo() {
    const apiInfo = `
        <h2><i class="fas fa-info-circle"></i> API Information</h2>
        <div style="text-align: left; margin-top: 20px;">
            <h3>Available Endpoints:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>GET /</strong> - Welcome message and API status</li>
                <li><strong>POST /ask</strong> - Submit questions about uploaded documents</li>
                <li><strong>POST /upload</strong> - Upload new documents (PDF, TXT, DOCX)</li>
                <li><strong>GET /documents</strong> - List all uploaded documents</li>
                <li><strong>DELETE /documents/{id}</strong> - Delete a specific document</li>
                <li><strong>POST /documents/rebuild-index</strong> - Rebuild search index</li>
            </ul>
            
            <h3>API Configuration:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Base URL:</strong> ${API_BASE_URL}</li>
                <li><strong>Upload Limit:</strong> 10MB per file</li>
                <li><strong>Supported Formats:</strong> PDF, TXT, DOCX</li>
            </ul>
            
            <h3>Query Parameters:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>query:</strong> Your question (string, max 500 chars)</li>
                <li><strong>top_k:</strong> Number of relevant chunks to retrieve (1-20)</li>
                <li><strong>document_ids:</strong> Optional list of specific documents to search</li>
            </ul>
            
            <h3>Technology Stack:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Backend:</strong> FastAPI + Python</li>
                <li><strong>AI Model:</strong> RAG (Retrieval-Augmented Generation)</li>
                <li><strong>Vector Database:</strong> FAISS with cosine similarity</li>
                <li><strong>LLM:</strong> Hugging Face Router API / OpenAI</li>
                <li><strong>Text Processing:</strong> PyPDF2, python-docx</li>
            </ul>
        </div>
    `;
    showModal(apiInfo);
}

function showAbout() {
    const aboutContent = `
        <h2><i class="fas fa-book"></i> About This Application</h2>
        <div style="text-align: left; margin-top: 20px;">
            <h3>Document AI Assistant</h3>
            <p style="margin: 15px 0; line-height: 1.6;">
                This intelligent assistant helps you understand and query your documents using 
                advanced RAG (Retrieval-Augmented Generation) technology. Upload multiple documents 
                and get precise answers based on their content.
            </p>
            
            <h3>Key Features:</h3>
            <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li>Multi-document upload and management</li>
                <li>Real-time document processing and indexing</li>
                <li>Intelligent question answering with source attribution</li>
                <li>Selective document querying</li>
                <li>Fast semantic search with FAISS vector database</li>
                <li>Support for PDF, TXT, and DOCX files</li>
            </ul>
            
            <h3>How It Works:</h3>
            <ol style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li>Upload your documents through the interface</li>
                <li>Documents are processed and indexed automatically</li>
                <li>Ask questions about your documents</li>
                <li>AI retrieves relevant sections and generates precise answers</li>
                <li>Source documents are cited in responses</li>
            </ol>
            
            <h3>Supported Formats:</h3>
            <p style="margin: 15px 0; line-height: 1.6;">
                📄 PDF documents, 📝 Plain text files, 📃 Microsoft Word documents (DOCX)
            </p>
            
            <p style="margin-top: 20px; font-size: 0.9em; color: #718096;">
                <strong>Built in 2026</strong> | RAG + FastAPI + FAISS + Modern Web Technologies
            </p>
        </div>
    `;
    showModal(aboutContent);
}

// Utility functions for better UX
function formatResponse(text) {
    // Add basic formatting to responses
    return text
        .replace(/₹(\d+)/g, '<strong>₹$1</strong>') // Highlight prices
        .replace(/\b(\d+)\s*(years?|months?|days?)\b/gi, '<strong>$1 $2</strong>') // Highlight time periods
        .replace(/\b(Section \d+|Rule \d+|Article \d+)\b/gi, '<strong>$1</strong>'); // Highlight legal references
}

// Auto-refresh API status periodically
setInterval(checkApiStatus, 300000); // Check every 5 minutes

// Add some visual feedback for button interactions
sendButton.addEventListener('mouseenter', function() {
    if (!this.disabled) {
        this.style.transform = 'scale(1.05)';
    }
});

sendButton.addEventListener('mouseleave', function() {
    if (!this.disabled) {
        this.style.transform = 'scale(1)';
    }
});

// Performance optimization: debounce the auto-resize function
let resizeTimeout;
questionInput.addEventListener('input', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(autoResizeTextarea, 100);
});

// Add offline/online detection
window.addEventListener('online', function() {
    console.log('Connection restored');
    checkApiStatus();
});

// Document Management Functions
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadBtn = document.getElementById('uploadBtn');
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        handleFileSelection(Array.from(e.target.files));
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFileSelection(Array.from(e.dataTransfer.files));
    });
}

function handleFileSelection(files) {
    const allowedTypes = ['.pdf', '.txt', '.docx'];
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (allowedTypes.includes(extension)) {
            if (file.size <= 10 * 1024 * 1024) { // 10MB limit
                validFiles.push(file);
            } else {
                invalidFiles.push(`${file.name} (too large)`);
            }
        } else {
            invalidFiles.push(`${file.name} (unsupported type)`);
        }
    });
    
    if (invalidFiles.length > 0) {
        showError(`Some files were rejected: ${invalidFiles.join(', ')}`);
    }
    
    if (validFiles.length > 0) {
        filesToUpload = validFiles;
        updateUploadButton();
        updateFileList();
    }
}

function updateFileList() {
    const uploadArea = document.getElementById('uploadArea');
    if (filesToUpload.length > 0) {
        const fileNames = filesToUpload.map(f => f.name).join(', ');
        uploadArea.innerHTML = `
            <i class="fas fa-files"></i>
            <p>Ready to upload: <strong>${filesToUpload.length} file(s)</strong></p>
            <small>${fileNames}</small>
        `;
    } else {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop files here or <span class="upload-link" onclick="document.getElementById('fileInput').click()">browse</span></p>
            <small>Supports PDF, TXT, DOCX files (max 10MB)</small>
        `;
    }
}

function updateUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = filesToUpload.length === 0;
    uploadBtn.innerHTML = filesToUpload.length > 0 
        ? `<i class="fas fa-upload"></i> Upload ${filesToUpload.length} Document(s)`
        : `<i class="fas fa-upload"></i> Upload Documents`;
}

async function uploadFiles() {
    if (filesToUpload.length === 0) return;
    
    const uploadBtn = document.getElementById('uploadBtn');
    const originalText = uploadBtn.innerHTML;
    
    try {
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            
            uploadBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading ${i + 1}/${filesToUpload.length}...`;
            
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to upload ${file.name}: ${errorData.detail || 'Unknown error'}`);
            }
        }
        
        // Reset upload state
        filesToUpload = [];
        document.getElementById('fileInput').value = '';
        updateFileList();
        updateUploadButton();
        
        // Reload documents
        await loadDocuments();
        
        showSuccess(`Successfully uploaded ${filesToUpload.length} document(s)!`);
        
    } catch (error) {
        console.error('Upload Error:', error);
        showError(`Upload failed: ${error.message}`);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = originalText;
    }
}

async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE_URL}/documents`);
        if (response.ok) {
            uploadedDocuments = await response.json();
            updateDocumentsList();
        } else {
            console.error('Failed to load documents');
        }
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

function updateDocumentsList() {
    const container = document.getElementById('documentsContainer');
    const docCount = document.getElementById('docCount');
    const noDocuments = document.getElementById('noDocuments');
    
    docCount.textContent = uploadedDocuments.length;
    
    if (uploadedDocuments.length === 0) {
        noDocuments.style.display = 'block';
        return;
    }
    
    noDocuments.style.display = 'none';
    
    container.innerHTML = uploadedDocuments.map(doc => `
        <div class="document-item" data-doc-id="${doc.id}">
            <input type="checkbox" class="document-checkbox" 
                   id="doc-${doc.id}" 
                   onchange="toggleDocumentSelection('${doc.id}')">
            <div class="document-info">
                <div class="document-name">${doc.filename}</div>
                <div class="document-meta">
                    <span>📄 ${(doc.file_size / 1024).toFixed(1)} KB</span>
                    <span>📦 ${doc.chunk_count} chunks</span>
                    <span>📅 ${new Date(doc.upload_date).toLocaleDateString()}</span>
                    <span class="document-status status-${doc.status}">${doc.status}</span>
                </div>
            </div>
            <div class="document-actions">
                <button class="btn-danger" onclick="deleteDocument('${doc.id}', '${doc.filename}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function toggleDocumentSelection(docId) {
    const checkbox = document.getElementById(`doc-${docId}`);
    const item = document.querySelector(`[data-doc-id="${docId}"]`);
    
    if (checkbox.checked) {
        selectedDocuments.push(docId);
        item.classList.add('selected');
    } else {
        selectedDocuments = selectedDocuments.filter(id => id !== docId);
        item.classList.remove('selected');
    }
}

async function deleteDocument(docId, filename) {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/documents/${docId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadDocuments();
            showSuccess(`Document "${filename}" deleted successfully!`);
        } else {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to delete document');
        }
    } catch (error) {
        console.error('Delete Error:', error);
        showError(`Failed to delete document: ${error.message}`);
    }
}

async function refreshDocuments() {
    const btn = event.target.closest('button');
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        await loadDocuments();
    } finally {
        btn.innerHTML = originalIcon;
    }
}

async function rebuildIndex() {
    if (!confirm('Rebuild the search index? This may take a moment.')) {
        return;
    }
    
    const btn = event.target.closest('button');
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/documents/rebuild-index`, {
            method: 'POST'
        });
        
        if (response.ok) {
            showSuccess('Search index rebuilt successfully!');
        } else {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Failed to rebuild index');
        }
    } catch (error) {
        console.error('Rebuild Error:', error);
        showError(`Failed to rebuild index: ${error.message}`);
    } finally {
        btn.innerHTML = originalIcon;
    }
}

function toggleDocumentPanel() {
    const content = document.getElementById('documentPanelContent');
    const icon = document.getElementById('toggleIcon');
    
    isDocumentPanelCollapsed = !isDocumentPanelCollapsed;
    
    if (isDocumentPanelCollapsed) {
        content.classList.add('collapsed');
        icon.className = 'fas fa-chevron-down';
    } else {
        content.classList.remove('collapsed');
        icon.className = 'fas fa-chevron-up';
    }
}

function showSuccess(message) {
    addMessage(message, 'bot', false, 'success');
}

// Update addMessage to support success styling
function addMessage(content, sender, isError = false, type = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const messageP = document.createElement('p');
    
    // Handle markdown-style formatting for sources
    if (content.includes('📚 *Sources:')) {
        const parts = content.split('\n\n📚 *Sources:');
        const mainText = parts[0];
        const sources = parts[1] ? parts[1].replace('*', '') : '';
        
        messageP.innerHTML = `${mainText}${sources ? `<br><br><em style="color: #718096; font-size: 0.9em;">📚 Sources:${sources}</em>` : ''}`;
    } else {
        messageP.textContent = content;
    }
    
    if (isError) {
        messageP.style.background = '#fed7d7';
        messageP.style.color = '#c53030';
        messageP.style.borderLeft = '4px solid #fc8181';
    } else if (type === 'success') {
        messageP.style.background = '#c6f6d5';
        messageP.style.color = '#22543d';
        messageP.style.borderLeft = '4px solid #48bb78';
    }
    
    contentDiv.appendChild(messageP);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}