'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  onUploadComplete?: (documentId: string, filename: string) => void
}

interface UploadProgress {
  file: File
  status: 'uploading' | 'success' | 'error'
  progress: number
  documentId?: string
  error?: string
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads: UploadProgress[] = acceptedFiles.map(file => ({
      file,
      status: 'uploading' as const,
      progress: 0,
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Process each file
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i]
      const uploadIndex = uploads.length + i

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, index) => 
            index === uploadIndex 
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          ))
        }, 100)

        const response = await apiService.uploadDocument(file)
        
        clearInterval(progressInterval)
        
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { 
                ...upload, 
                status: 'success', 
                progress: 100, 
                documentId: response.document_id 
              }
            : upload
        ))

        onUploadComplete?.(response.document_id, response.filename)
        toast.success(`${file.name} uploaded successfully!`)

      } catch (error) {
        setUploads(prev => prev.map((upload, index) => 
          index === uploadIndex 
            ? { 
                ...upload, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : upload
        ))
        
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }, [uploads.length, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index))
  }

  const retryUpload = async (index: number) => {
    const upload = uploads[index]
    if (!upload) return

    setUploads(prev => prev.map((u, i) => 
      i === index ? { ...u, status: 'uploading', progress: 0, error: undefined } : u
    ))

    try {
      const response = await apiService.uploadDocument(upload.file)
      
      setUploads(prev => prev.map((u, i) => 
        i === index 
          ? { 
              ...u, 
              status: 'success', 
              progress: 100, 
              documentId: response.document_id 
            }
          : u
      ))

      onUploadComplete?.(response.document_id, response.filename)
      toast.success(`${upload.file.name} uploaded successfully!`)

    } catch (error) {
      setUploads(prev => prev.map((u, i) => 
        i === index 
          ? { 
              ...u, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : u
      ))
      
      toast.error(`Failed to upload ${upload.file.name}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, TXT, or DOCX files to add to the knowledge base. Maximum file size: 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              
              {isDragActive ? (
                <div>
                  <p className="text-blue-600 font-medium">Drop files here...</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    PDF, TXT, DOCX files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <motion.div
                  key={`${upload.file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {upload.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                    {upload.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.file.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    {upload.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}

                    {upload.status === 'success' && (
                      <p className="text-xs text-green-600">
                        Upload complete • ID: {upload.documentId}
                      </p>
                    )}

                    {upload.status === 'error' && (
                      <p className="text-xs text-red-600">
                        {upload.error || 'Upload failed'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {upload.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(index)}
                        className="text-xs"
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUpload(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}