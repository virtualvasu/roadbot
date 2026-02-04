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
        // Send request to API
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: question,
                top_k: topK
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add bot response to chat
        addMessage(data.answer, 'bot');
        
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
                <li><strong>POST /ask</strong> - Submit questions about traffic rules</li>
            </ul>
            
            <h3>API Configuration:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Base URL:</strong> ${API_BASE_URL}</li>
                <li><strong>Method:</strong> POST</li>
                <li><strong>Content-Type:</strong> application/json</li>
            </ul>
            
            <h3>Request Parameters:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>query:</strong> Your traffic rules question (string, max 500 chars)</li>
                <li><strong>top_k:</strong> Number of relevant documents to retrieve (1-20)</li>
            </ul>
            
            <h3>Technology Stack:</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>Backend:</strong> FastAPI + Python</li>
                <li><strong>AI Model:</strong> RAG (Retrieval-Augmented Generation)</li>
                <li><strong>Vector Database:</strong> FAISS</li>
                <li><strong>LLM:</strong> Hugging Face Router API / OpenAI</li>
            </ul>
        </div>
    `;
    showModal(apiInfo);
}

function showAbout() {
    const aboutContent = `
        <h2><i class="fas fa-book"></i> About This Application</h2>
        <div style="text-align: left; margin-top: 20px;">
            <h3>Tamil Nadu Traffic Rules Assistant</h3>
            <p style="margin: 15px 0; line-height: 1.6;">
                This intelligent assistant helps you understand Tamil Nadu traffic regulations, 
                penalties, and procedures using advanced RAG (Retrieval-Augmented Generation) technology.
            </p>
            
            <h3>Key Features:</h3>
            <ul style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li>Real-time answers to traffic rule questions</li>
                <li>Accurate penalty and fine information</li>
                <li>Official Tamil Nadu traffic regulations</li>
                <li>Fast semantic search with FAISS vector database</li>
                <li>Configurable result precision with top-k parameter</li>
            </ul>
            
            <h3>How It Works:</h3>
            <ol style="margin: 15px 0; padding-left: 20px; line-height: 1.8;">
                <li>Your question is processed using semantic search</li>
                <li>Relevant traffic rule sections are retrieved from the database</li>
                <li>AI generates a precise answer based on official regulations</li>
                <li>Response includes specific fines and penalties when applicable</li>
            </ol>
            
            <h3>Data Source:</h3>
            <p style="margin: 15px 0; line-height: 1.6;">
                All information is derived from official Tamil Nadu traffic rules and 
                Motor Vehicles Act documentation to ensure accuracy and reliability.
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

window.addEventListener('offline', function() {
    console.log('Connection lost');
    const statusElement = apiStatus.querySelector('span');
    const iconElement = apiStatus.querySelector('i');
    statusElement.textContent = 'No Connection';
    apiStatus.className = 'status-indicator offline';
    iconElement.style.color = '#ef4444';
});