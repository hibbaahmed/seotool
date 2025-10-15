'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  LinkIcon,
  PhotoIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ContentEdit {
  id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'scheduled'
  seoScore: number
  keywords: string[]
  metaTitle: string
  metaDescription: string
  lastModified: string
}

const mockContent: ContentEdit = {
  id: '1',
  title: 'Ultimate Guide to SEO in 2024',
  content: `# Ultimate Guide to SEO in 2024

## Introduction

Search Engine Optimization (SEO) continues to evolve rapidly in 2024. This comprehensive guide covers the latest strategies, tools, and techniques to help your website rank higher in search results.

## Key SEO Trends for 2024

### 1. AI-Powered Content
Artificial intelligence is revolutionizing content creation and optimization. Search engines are becoming more sophisticated in understanding user intent and content quality.

### 2. Core Web Vitals
Google continues to prioritize user experience metrics. Focus on improving your site's loading speed, interactivity, and visual stability.

### 3. E-A-T and YMYL
Expertise, Authoritativeness, and Trustworthiness remain crucial, especially for Your Money Your Life (YMYL) topics.

## Technical SEO Essentials

### Site Structure
- Implement proper heading hierarchy (H1, H2, H3)
- Use descriptive URLs
- Optimize internal linking
- Ensure mobile responsiveness

### Page Speed Optimization
- Compress images
- Minimize CSS and JavaScript
- Use a Content Delivery Network (CDN)
- Enable browser caching

## Content Optimization

### Keyword Research
- Use tools like Google Keyword Planner
- Analyze competitor keywords
- Focus on long-tail keywords
- Consider search intent

### Content Quality
- Write for your audience, not search engines
- Provide comprehensive coverage of topics
- Include relevant images and videos
- Update content regularly

## Link Building Strategies

### Internal Linking
- Link to relevant pages within your site
- Use descriptive anchor text
- Create topic clusters
- Implement breadcrumb navigation

### External Linking
- Build relationships with industry websites
- Create shareable content
- Guest posting on relevant blogs
- Participate in industry forums

## Local SEO

### Google My Business
- Claim and optimize your listing
- Encourage customer reviews
- Post regular updates
- Add high-quality photos

### Local Citations
- Ensure consistent NAP (Name, Address, Phone) information
- Submit to local directories
- Build local backlinks
- Create location-specific content

## Measuring Success

### Key Metrics
- Organic traffic growth
- Keyword rankings
- Click-through rates (CTR)
- Conversion rates
- Page load speed

### Tools to Use
- Google Analytics
- Google Search Console
- SEMrush
- Ahrefs
- Screaming Frog

## Conclusion

SEO in 2024 requires a holistic approach that combines technical optimization, high-quality content, and user experience. Stay updated with the latest trends and continuously optimize your strategy based on data and performance metrics.`,
  status: 'draft',
  seoScore: 78,
  keywords: ['SEO', 'search engine optimization', 'digital marketing', 'content marketing', 'keyword research'],
  metaTitle: 'Ultimate Guide to SEO in 2024 - Complete Strategy',
  metaDescription: 'Learn the latest SEO strategies for 2024. Complete guide covering technical SEO, content optimization, and ranking factors.',
  lastModified: '2024-01-15'
}

export default function SEOEditorPage() {
  const [content, setContent] = useState<ContentEdit>(mockContent)
  const [isEditing, setIsEditing] = useState(false)
  const [editMode, setEditMode] = useState<'content' | 'seo' | 'links'>('content')
  const [newKeyword, setNewKeyword] = useState('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [suggestions, setSuggestions] = useState([
    {
      type: 'meta_title',
      message: 'Meta title is too long (65+ characters)',
      suggestion: 'Consider shortening to under 60 characters',
      severity: 'medium'
    },
    {
      type: 'keyword_density',
      message: 'Primary keyword appears only 2 times',
      suggestion: 'Increase keyword density to 1-2% for better optimization',
      severity: 'low'
    },
    {
      type: 'internal_links',
      message: 'No internal links found',
      suggestion: 'Add 3-5 relevant internal links to improve site structure',
      severity: 'high'
    }
  ])

  const handleContentChange = (field: keyof ContentEdit, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }))
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !content.keywords.includes(newKeyword.trim())) {
      setContent(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setContent(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const optimizeContent = async () => {
    setIsOptimizing(true)
    try {
      // Simulate optimization
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update SEO score
      setContent(prev => ({ ...prev, seoScore: Math.min(95, prev.seoScore + 10) }))
      toast.success('Content optimized successfully!')
    } catch (error) {
      toast.error('Failed to optimize content')
    } finally {
      setIsOptimizing(false)
    }
  }

  const rewriteContent = async () => {
    try {
      // Simulate rewriting
      await new Promise(resolve => setTimeout(resolve, 3000))
      toast.success('Content rewritten successfully!')
    } catch (error) {
      toast.error('Failed to rewrite content')
    }
  }

  const regenerateImage = async () => {
    try {
      // Simulate image regeneration
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Image regenerated successfully!')
    } catch (error) {
      toast.error('Failed to regenerate image')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mr-3" />
            AI SEO Editor
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Edit and optimize existing content with intelligent suggestions and improvements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <PencilSquareIcon className="h-5 w-5 text-blue-600 mr-2" />
                      Content Editor
                    </CardTitle>
                    <CardDescription>
                      Edit your content with AI-powered suggestions
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={editMode === 'content' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('content')}
                    >
                      Content
                    </Button>
                    <Button
                      variant={editMode === 'seo' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('seo')}
                    >
                      SEO
                    </Button>
                    <Button
                      variant={editMode === 'links' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setEditMode('links')}
                    >
                      Links
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editMode === 'content' && (
                  <div className="space-y-4">
                    <Input
                      label="Title"
                      value={content.title}
                      onChange={(e) => handleContentChange('title', e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content
                      </label>
                      <textarea
                        className="w-full h-96 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={content.content}
                        onChange={(e) => handleContentChange('content', e.target.value)}
                        placeholder="Enter your content here..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={rewriteContent} variant="outline" size="sm">
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Rewrite with AI
                      </Button>
                      <Button onClick={optimizeContent} loading={isOptimizing} size="sm">
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Optimize Content
                      </Button>
                    </div>
                  </div>
                )}

                {editMode === 'seo' && (
                  <div className="space-y-4">
                    <Input
                      label="Meta Title"
                      value={content.metaTitle}
                      onChange={(e) => handleContentChange('metaTitle', e.target.value)}
                      helperText={`${content.metaTitle.length}/60 characters`}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        className="w-full h-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={content.metaDescription}
                        onChange={(e) => handleContentChange('metaDescription', e.target.value)}
                        placeholder="Enter meta description..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {content.metaDescription.length}/160 characters
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Keywords
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add keyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                        />
                        <Button onClick={addKeyword} variant="outline" size="sm">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {content.keywords.map((keyword) => (
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
                  </div>
                )}

                {editMode === 'links' && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Internal Link Suggestions
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        AI will analyze your content and suggest relevant internal links
                      </p>
                      <Button onClick={() => toast.success('Link analysis completed!')}>
                        Analyze Links
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  SEO Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {content.seoScore}/100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${content.seoScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {content.seoScore >= 80 ? 'Excellent' : 
                     content.seoScore >= 60 ? 'Good' : 
                     content.seoScore >= 40 ? 'Needs Improvement' : 'Poor'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Status */}
            <Card>
              <CardHeader>
                <CardTitle>Content Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      content.status === 'published' ? 'bg-green-100 text-green-800' :
                      content.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {content.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Modified</span>
                    <span className="text-sm font-medium">{content.lastModified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Word Count</span>
                    <span className="text-sm font-medium">{content.content.split(' ').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  SEO Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(suggestion.severity)}`}>
                          {suggestion.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white mb-1">
                        {suggestion.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" onClick={regenerateImage}>
                    <PhotoIcon className="h-4 w-4 mr-2" />
                    Regenerate Images
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


