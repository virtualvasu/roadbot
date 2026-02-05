export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface QueryRequest {
  query: string
  top_k?: number
  document_ids?: string[]
}

export interface QueryResponse {
  answer: string
  documents_used: string[]
}

export interface DocumentInfo {
  id: string
  filename: string
  upload_date: string
  file_size: number
  status: string
  chunk_count: number
}

export interface UploadResponse {
  success: boolean
  document_id: string
  filename: string
  message: string
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  documents_used?: string[]
}