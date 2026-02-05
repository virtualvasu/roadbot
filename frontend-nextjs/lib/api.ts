import axios from 'axios'
import { API_BASE_URL, QueryRequest, QueryResponse } from './types'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const apiService = {
  async askQuestion(request: QueryRequest): Promise<QueryResponse> {
    const response = await api.post('/ask', request)
    return response.data
  },
}