'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Trash2, 
  Calendar, 
  HardDrive, 
  RefreshCw, 
  Search,
  Download,
  Eye,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentInfo } from '@/lib/types'
import { apiService } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface DocumentManagerProps {
  onDocumentChange?: () => void
}

export function DocumentManager({ onDocumentChange }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    // Filter documents based on search term
    const filtered = documents.filter(doc =>
      doc.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    // Sort documents
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename)
        case 'size':
          return b.file_size - a.file_size
        case 'date':
        default:
          return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      }
    })
    
    setFilteredDocuments(sorted)
  }, [documents, searchTerm, sortBy])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const docs = await apiService.getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return
    }

    try {
      await apiService.deleteDocument(documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      onDocumentChange?.()
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleRebuildIndex = async () => {
    setIsRebuilding(true)
    try {
      await apiService.rebuildIndex()
      await loadDocuments() // Reload documents to get updated chunk counts
      onDocumentChange?.()
      toast.success('Search index rebuilt successfully')
    } catch (error) {
      console.error('Failed to rebuild index:', error)
      toast.error('Failed to rebuild search index')
    } finally {
      setIsRebuilding(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Management
              </CardTitle>
              <CardDescription>
                Manage your uploaded documents and rebuild the search index
              </CardDescription>
            </div>
            <Button
              onClick={handleRebuildIndex}
              disabled={isRebuilding || documents.length === 0}
              variant="outline"
              className="shrink-0"
            >
              {isRebuilding ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Rebuild Index
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total Documents</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">{documents.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Total Size</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatFileSize(documents.reduce((acc, doc) => acc + doc.file_size, 0))}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Total Chunks</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {documents.reduce((acc, doc) => acc + doc.chunk_count, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {documents.length === 0 ? (
                <div>
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm mt-1">Upload your first document to get started.</p>
                </div>
              ) : (
                <div>
                  <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p>No documents match your search.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredDocuments.map((document) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {document.filename}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(document.upload_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatFileSize(document.file_size)}
                        </span>
                        {document.chunk_count > 0 && (
                          <span>{document.chunk_count} chunks</span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id, document.filename)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}