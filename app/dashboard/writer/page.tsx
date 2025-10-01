'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  PencilSquareIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  LinkIcon,
  CalendarIcon,
  ShareIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
  LanguageIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { ContentGenerationRequest } from '@/lib/types'
import toast from 'react-hot-toast'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
]

const tones = [
  { value: 'professional', label: 'Professional', description: 'Formal, authoritative tone' },
  { value: 'casual', label: 'Casual', description: 'Friendly, conversational tone' },
  { value: 'technical', label: 'Technical', description: 'Expert-level, detailed tone' },
  { value: 'creative', label: 'Creative', description: 'Engaging, storytelling tone' }
]

const lengths = [
  { value: 'short', label: 'Short (500-800 words)', words: '500-800' },
  { value: 'medium', label: 'Medium (800-1500 words)', words: '800-1500' },
  { value: 'long', label: 'Long (1500+ words)', words: '1500+' }
]

interface GeneratedContent {
  title: string
  content: string
  tableOfContents: string[]
  images: Array<{ placeholder: string; description: string; position: number }>
  videos: Array<{ placeholder: string; description: string; position: number }>
  links: Array<{ text: string; url: string; position: number }>
  wordCount: number
  readingTime: number
  seoScore: number
}

export default function AIWriterPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [formData, setFormData] = useState<ContentGenerationRequest>({
    topic: '',
    keywords: [],
    language: 'en',
    tone: 'professional',
    length: 'medium',
    includeImages: true,
    includeVideo: false,
    includeTableOfContents: true,
    targetAudience: ''
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSyndicating, setIsSyndicating] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const handleInputChange = (field: keyof ContentGenerationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }))
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const generateContent = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Parse the generated content and extract structured elements
        const parsedContent = parseGeneratedContent(data.content, formData)
        setGeneratedContent(parsedContent)
        setEditedContent(parsedContent.content)
        toast.success('Content generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error('Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const parseGeneratedContent = (content: string, config: ContentGenerationRequest): GeneratedContent => {
    // Extract title (first H1)
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : config.topic

    // Extract table of contents
    const tocMatch = content.match(/## Table of Contents\n([\s\S]*?)(?=\n##|\n#|$)/)
    const toc = tocMatch ? 
      tocMatch[1].split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line) : []

    // Extract images (placeholder format: [IMAGE: description])
    const imageMatches = [...content.matchAll(/\[IMAGE:\s*([^\]]+)\]/g)]
    const images = imageMatches.map((match, index) => ({
      placeholder: match[0],
      description: match[1],
      position: content.indexOf(match[0])
    }))

    // Extract videos (placeholder format: [VIDEO: description])
    const videoMatches = [...content.matchAll(/\[VIDEO:\s*([^\]]+)\]/g)]
    const videos = videoMatches.map((match, index) => ({
      placeholder: match[0],
      description: match[1],
      position: content.indexOf(match[0])
    }))

    // Extract links (markdown format: [text](url))
    const linkMatches = [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
    const links = linkMatches.map((match, index) => ({
      text: match[1],
      url: match[2],
      position: content.indexOf(match[0])
    }))

    const wordCount = content.split(' ').length
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

    return {
      title,
      content,
      tableOfContents: toc,
      images,
      videos,
      links,
      wordCount,
      readingTime,
      seoScore: calculateSEOScore(content, config.keywords)
    }
  }

  const calculateSEOScore = (content: string, keywords: string[]): number => {
    let score = 100
    
    // Check keyword density
    const contentLower = content.toLowerCase()
    keywords.forEach(keyword => {
      const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
      const density = (keywordCount / content.split(' ').length) * 100
      if (density < 0.5) score -= 10
      if (density > 3) score -= 5
    })

    // Check heading structure
    const h1Count = (content.match(/^#\s/gm) || []).length
    if (h1Count === 0) score -= 20
    if (h1Count > 1) score -= 10

    // Check content length
    const wordCount = content.split(' ').length
    if (wordCount < 300) score -= 15
    if (wordCount > 2000) score -= 5

    return Math.max(0, score)
  }

  const publishToCMS = async () => {
    if (!generatedContent) {
      toast.error('No content to publish')
      return
    }

    setIsPublishing(true)
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: generatedContent.title,
          content: editedContent || generatedContent.content,
          type: 'BLOG',
          status: 'PUBLISHED',
          projectId: 'default-project',
          userId: 'current-user',
          keywords: formData.keywords,
          metaTitle: generatedContent.title,
          metaDescription: generatedContent.content.substring(0, 160),
          seoScore: generatedContent.seoScore
        }),
      })

      if (response.ok) {
        toast.success('Content published to CMS successfully!')
      } else {
        toast.error('Failed to publish content')
      }
    } catch (error) {
      toast.error('Failed to publish content')
    } finally {
      setIsPublishing(false)
    }
  }

  const syndicateToSocial = async () => {
    if (!generatedContent) {
      toast.error('No content to syndicate')
      return
    }

    setIsSyndicating(true)
    try {
      const socialPosts = [
        {
          platform: 'TWITTER',
          content: `🚀 ${generatedContent.title}\n\n${generatedContent.content.substring(0, 200)}...\n\n#SEO #ContentMarketing`,
          scheduledAt: new Date(Date.now() + 60000) // 1 minute from now
        },
        {
          platform: 'LINKEDIN',
          content: `📝 ${generatedContent.title}\n\n${generatedContent.content.substring(0, 300)}...\n\nRead the full article on our blog!`,
          scheduledAt: new Date(Date.now() + 300000) // 5 minutes from now
        },
        {
          platform: 'FACEBOOK',
          content: `🎯 ${generatedContent.title}\n\n${generatedContent.content.substring(0, 400)}...\n\nCheck out our latest insights!`,
          scheduledAt: new Date(Date.now() + 600000) // 10 minutes from now
        }
      ]

      // Simulate API calls for each platform
      for (const post of socialPosts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log(`Scheduled post for ${post.platform}:`, post.content)
      }

      toast.success('Content syndicated to social media platforms!')
    } catch (error) {
      toast.error('Failed to syndicate content')
    } finally {
      setIsSyndicating(false)
    }
  }

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
    if (!isEditing && editorRef.current) {
      editorRef.current.focus()
    }
  }

  const saveEdits = () => {
    if (generatedContent) {
      setGeneratedContent(prev => prev ? { ...prev, content: editedContent } : null)
      setIsEditing(false)
      toast.success('Changes saved!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <PencilSquareIcon className="h-8 w-8 text-blue-600 mr-3" />
            AI SEO Writer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Generate brand-tailored content in 150+ languages with AI-powered writing that ranks
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Generation Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
                  Content Brief
                </CardTitle>
                <CardDescription>
                  Configure your content generation parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Input
                    label="Topic/Title"
                    placeholder="Enter your content topic or title"
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Keywords
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add keyword"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} variant="outline">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Input
                    label="Target Audience"
                    placeholder="Describe your target audience"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <LanguageIcon className="h-4 w-4 inline mr-1" />
                      Language
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tone
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={formData.tone}
                      onChange={(e) => handleInputChange('tone', e.target.value)}
                    >
                      {tones.map((tone) => (
                        <option key={tone.value} value={tone.value}>
                          {tone.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Length
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={formData.length}
                      onChange={(e) => handleInputChange('length', e.target.value)}
                    >
                      {lengths.map((length) => (
                        <option key={length.value} value={length.value}>
                          {length.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Content Features
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeImages}
                        onChange={(e) => handleInputChange('includeImages', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <PhotoIcon className="h-4 w-4 ml-2 mr-2" />
                      <span className="text-sm">Include images</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeVideo}
                        onChange={(e) => handleInputChange('includeVideo', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <VideoCameraIcon className="h-4 w-4 ml-2 mr-2" />
                      <span className="text-sm">Include video</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.includeTableOfContents}
                        onChange={(e) => handleInputChange('includeTableOfContents', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <LinkIcon className="h-4 w-4 ml-2 mr-2" />
                      <span className="text-sm">Table of contents</span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={generateContent}
                  loading={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? 'Generating Content...' : 'Generate Content'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                    Generated Content
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleEditMode}
                        variant="outline"
                        size="sm"
                      >
                        <EditIcon className="h-4 w-4 mr-1" />
                        {isEditing ? 'Preview' : 'Edit'}
                      </Button>
                      {isEditing && (
                        <Button
                          onClick={saveEdits}
                          size="sm"
                        >
                          <SaveIcon className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription>
                  Review and edit your AI-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-4">
                    {/* Content Editor/Viewer */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {isEditing ? (
                        <textarea
                          ref={editorRef}
                          className="w-full h-80 resize-none border-none bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none"
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          placeholder="Edit your content here..."
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                          {editedContent || generatedContent.content}
                        </pre>
                      )}
                    </div>

                    {/* Table of Contents */}
                    {generatedContent.tableOfContents.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                          Table of Contents
                        </h3>
                        <ul className="space-y-1">
                          {generatedContent.tableOfContents.map((item, index) => (
                            <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                              {index + 1}. {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Media Placeholders */}
                    {(generatedContent.images.length > 0 || generatedContent.videos.length > 0) && (
                      <div className="space-y-2">
                        {generatedContent.images.map((image, index) => (
                          <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center">
                              <PhotoIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Image: {image.description}
                              </span>
                            </div>
                          </div>
                        ))}
                        {generatedContent.videos.map((video, index) => (
                          <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center">
                              <VideoCameraIcon className="h-5 w-5 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Video: {video.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={publishToCMS} 
                        loading={isPublishing}
                        variant="outline" 
                        size="sm"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Publish to CMS
                      </Button>
                      <Button 
                        onClick={syndicateToSocial} 
                        loading={isSyndicating}
                        variant="outline" 
                        size="sm"
                      >
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Syndicate to Social
                      </Button>
                      <Button variant="outline" size="sm">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Generated content will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Stats */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                    Content Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {generatedContent.wordCount}
                      </div>
                      <div className="text-sm text-gray-500">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedContent.readingTime}
                      </div>
                      <div className="text-sm text-gray-500">Min Read</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formData.keywords.length}
                      </div>
                      <div className="text-sm text-gray-500">Keywords</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {generatedContent.seoScore}
                      </div>
                      <div className="text-sm text-gray-500">SEO Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
