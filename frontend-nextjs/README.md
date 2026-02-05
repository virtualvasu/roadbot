# Traffic Rules Assistant - Next.js Frontend

A professional, modern frontend for the Tamil Nadu Traffic Rules RAG (Retrieval-Augmented Generation) system built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### ✨ Modern UI/UX
- **Professional Design**: Clean, modern interface with gradient backgrounds and smooth animations
- **Responsive Layout**: Mobile-first design that works perfectly on all devices
- **Interactive Animations**: Powered by Framer Motion for smooth transitions
- **Accessible**: Built with accessibility best practices

### 💬 Chat Interface
- **Real-time Chat**: Interactive chat with the RAG system
- **Message History**: Persistent conversation history
- **Source Citations**: Shows which documents were used to generate responses
- **Typing Indicators**: Visual feedback during response generation
- **Professional Styling**: Distinct styling for user and assistant messages

### 📁 Document Management
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **Multiple Formats**: Support for PDF, TXT, and DOCX files (up to 10MB)
- **Upload Progress**: Real-time upload progress indicators
- **Document Library**: Browse, search, and manage uploaded documents
- **Bulk Operations**: Delete documents and rebuild search indices

### 🔧 Advanced Features
- **Search Functionality**: Search through uploaded documents
- **Sorting Options**: Sort documents by name, date, or size
- **Statistics Dashboard**: View document counts, total size, and chunk information
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Toast Notifications**: Real-time feedback for all operations

## 🛠 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Custom components with Radix UI primitives
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **File Upload**: React Dropzone

## 📦 Installation

1. **Navigate to the frontend directory**:
```bash
cd frontend-nextjs
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
# Copy the environment file
cp .env.local.example .env.local

# Edit the environment variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend Integration

The frontend is designed to work with the FastAPI backend. Make sure your backend is running on the configured URL (default: `http://localhost:8000`).

**Backend Endpoints Used**:
- `POST /ask` - Ask questions to the RAG system
- `POST /upload` - Upload documents
- `GET /documents` - List all documents
- `DELETE /documents/{id}` - Delete a document
- `POST /documents/rebuild-index` - Rebuild search index

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (from-blue-600 to-indigo-700)
- **Background**: Gradient (from-blue-50 to-indigo-100)
- **Cards**: White with subtle shadows
- **Text**: Gray scale for hierarchy

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Semantic heading levels with consistent sizing

### Components
- **Responsive Cards**: Flexible card layouts
- **Interactive Buttons**: Multiple variants (primary, secondary, outline, ghost)
- **Form Controls**: Styled inputs, textareas, and file uploads
- **Animations**: Smooth transitions and micro-interactions

## 📱 Features Overview

### 1. Chat Assistant
- **Real-time Q&A**: Ask questions about Tamil Nadu traffic rules
- **Context-aware**: Responses based on uploaded documents
- **Source Attribution**: See which documents informed each answer
- **Professional UI**: Clean chat interface with typing indicators

### 2. Document Upload
- **Multi-format Support**: PDF, TXT, DOCX files
- **Drag & Drop**: Easy file selection
- **Progress Tracking**: Real-time upload progress
- **Validation**: File type and size validation
- **Batch Upload**: Upload multiple files simultaneously

### 3. Document Management
- **Document Library**: View all uploaded documents
- **Search & Filter**: Find documents quickly
- **Sorting Options**: Sort by date, name, or size
- **Statistics**: Document count, total size, chunk count
- **Operations**: Delete documents, rebuild search index

## 🚀 Getting Started

1. **Start the backend server** (make sure it's running on port 8000)
2. **Install frontend dependencies**: `npm install`
3. **Start the development server**: `npm run dev`
4. **Open browser**: Navigate to http://localhost:3000

## 📊 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
