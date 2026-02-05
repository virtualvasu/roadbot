import axios from 'axios'
import { API_BASE_URL, QueryRequest, QueryResponse, DocumentInfo, UploadResponse } from './types'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const apiService = {
  async askQuestion(request: QueryRequest): Promise<QueryResponse> {
    const response = await api.post('/ask', request)
    return response.data
  },

  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getDocuments(): Promise<DocumentInfo[]> {
    const response = await api.get('/documents')
    return response.data
  },

  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/documents/${documentId}`)
    return response.data
  },

  async rebuildIndex(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/documents/rebuild-index')
    return response.data
  },
}