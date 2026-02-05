'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Upload, 
  Settings, 
  Car,
  Shield,
  AlertTriangle,
  BookOpen,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { FileUpload } from '@/components/documents/FileUpload'
import { DocumentManager } from '@/components/documents/DocumentManager'

type ActiveTab = 'chat' | 'upload' | 'manage'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'chat' as const, label: 'Chat Assistant', icon: MessageSquare },
    { id: 'upload' as const, label: 'Upload Documents', icon: Upload },
    { id: 'manage' as const, label: 'Manage Documents', icon: Settings },
  ]

  const features = [
    {
      icon: Car,
      title: 'Traffic Rules',
      description: 'Comprehensive Tamil Nadu traffic regulations and guidelines'
    },
    {
      icon: Shield,
      title: 'Safety Guidelines',
      description: 'Road safety measures and best practices for drivers'
    },
    {
      icon: AlertTriangle,
      title: 'Violation Penalties',
      description: 'Fines, penalties, and consequences for traffic violations'
    },
    {
      icon: BookOpen,
      title: 'License Information',
      description: 'Driving license requirements and renewal procedures'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Traffic Rules Assistant</h1>
                <p className="text-sm text-gray-600">Tamil Nadu</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden py-4 border-t"
            >
              <nav className="flex flex-col gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Features Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What I Can Help With</CardTitle>
                  <CardDescription>
                    Ask me about any aspect of Tamil Nadu traffic rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-gray-900">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-sm text-blue-900 mb-2">
                      Example Questions
                    </h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• What is the speed limit in city areas?</li>
                      <li>• What documents do I need for DL renewal?</li>
                      <li>• What is the penalty for helmet violations?</li>
                      <li>• How do I register a new vehicle?</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[700px]">
                <ChatInterface />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Documents</h2>
              <p className="text-gray-600">
                Add new documents to enhance the assistant's knowledge base. 
                Supported formats: PDF, TXT, DOCX (max 10MB each).
              </p>
            </div>
            <FileUpload 
              onUploadComplete={(documentId, filename) => {
                console.log('Document uploaded:', { documentId, filename })
              }}
            />
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Documents</h2>
              <p className="text-gray-600">
                View, organize, and manage your uploaded documents. 
                Rebuild the search index when needed for optimal performance.
              </p>
            </div>
            <DocumentManager 
              onDocumentChange={() => {
                console.log('Document collection changed')
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Traffic Rules Assistant</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Professional RAG-powered assistant for Tamil Nadu traffic rules and regulations
            </p>
            <p className="text-xs text-gray-500">
              Built with Next.js, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
