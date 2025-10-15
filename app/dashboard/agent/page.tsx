'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  LinkIcon,
  DocumentTextIcon,
  TagIcon,
  GlobeAltIcon,
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { SEOIssue } from '@/lib/types'
import toast from 'react-hot-toast'
import CompetitiveAnalysisForm from '@/components/CompetitiveAnalysisForm'
import ContentGenerator from '@/components/ContentGenerator'

interface SiteAnalysis {
  url: string
  totalPages: number
  analyzedPages: number
  issuesFound: number
  issuesFixed: number
  lastScan: string
  status: 'idle' | 'scanning' | 'completed' | 'error'
}

const mockIssues: SEOIssue[] = [
  {
    id: '1',
    type: 'meta_title',
    severity: 'high',
    message: 'Missing or duplicate meta title',
    suggestion: 'Add unique, descriptive meta titles (50-60 characters)',
    contentId: 'page-1',
    isFixed: false,
    createdAt: new Date()
  },
  {
    id: '2',
    type: 'meta_description',
    severity: 'medium',
    message: 'Meta description too short',
    suggestion: 'Expand meta description to 150-160 characters',
    contentId: 'page-2',
    isFixed: false,
    createdAt: new Date()
  },
  {
    id: '3',
    type: 'canonical_url',
    severity: 'high',
    message: 'Missing canonical URL',
    suggestion: 'Add canonical URL to prevent duplicate content issues',
    contentId: 'page-3',
    isFixed: false,
    createdAt: new Date()
  },
  {
    id: '4',
    type: 'alt_text',
    severity: 'medium',
    message: 'Images missing alt text',
    suggestion: 'Add descriptive alt text to all images for accessibility',
    contentId: 'page-4',
    isFixed: false,
    createdAt: new Date()
  },
  {
    id: '5',
    type: 'internal_linking',
    severity: 'low',
    message: 'Poor internal linking structure',
    suggestion: 'Add more relevant internal links to improve site structure',
    contentId: 'page-5',
    isFixed: false,
    createdAt: new Date()
  },
  {
    id: '6',
    type: 'schema_markup',
    severity: 'medium',
    message: 'Missing structured data',
    suggestion: 'Add JSON-LD schema markup for better search visibility',
    contentId: 'page-6',
    isFixed: false,
    createdAt: new Date()
  }
]

const issueTypes = {
  meta_title: { label: 'Meta Title', icon: TagIcon, color: 'text-red-600' },
  meta_description: { label: 'Meta Description', icon: DocumentTextIcon, color: 'text-orange-600' },
  canonical_url: { label: 'Canonical URL', icon: LinkIcon, color: 'text-yellow-600' },
  alt_text: { label: 'Alt Text', icon: EyeIcon, color: 'text-blue-600' },
  internal_linking: { label: 'Internal Linking', icon: LinkIcon, color: 'text-green-600' },
  schema_markup: { label: 'Schema Markup', icon: CogIcon, color: 'text-purple-600' }
}

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
  low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
}

export default function SEOAgentPage() {
  const [siteUrl, setSiteUrl] = useState('https://example.com')
  const [analysis, setAnalysis] = useState<SiteAnalysis>({
    url: 'https://example.com',
    totalPages: 0,
    analyzedPages: 0,
    issuesFound: 0,
    issuesFixed: 0,
    lastScan: '',
    status: 'idle'
  })
  const [issues, setIssues] = useState<SEOIssue[]>(mockIssues)
  const [selectedIssue, setSelectedIssue] = useState<SEOIssue | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isFixing, setIsFixing] = useState(false)


  const startScan = async () => {
    if (!siteUrl.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    setIsScanning(true)
    setAnalysis(prev => ({ ...prev, status: 'scanning' }))

    try {
      // Simulate scanning process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setAnalysis(prev => ({
          ...prev,
          analyzedPages: Math.floor((i / 100) * 50),
          totalPages: 50
        }))
      }

      setAnalysis(prev => ({
        ...prev,
        status: 'completed',
        issuesFound: issues.length,
        lastScan: new Date().toISOString()
      }))
      toast.success('Site scan completed successfully!')
    } catch (error) {
      setAnalysis(prev => ({ ...prev, status: 'error' }))
      toast.error('Failed to scan site')
    } finally {
      setIsScanning(false)
    }
  }

  const fixIssue = async (issueId: string) => {
    setIsFixing(true)
    try {
      // Simulate fixing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIssues(prev => prev.map(issue => 
        issue.id === issueId ? { ...issue, isFixed: true } : issue
      ))
      
      setAnalysis(prev => ({
        ...prev,
        issuesFixed: prev.issuesFixed + 1
      }))
      
      toast.success('Issue fixed successfully!')
    } catch (error) {
      toast.error('Failed to fix issue')
    } finally {
      setIsFixing(false)
    }
  }

  const fixAllIssues = async () => {
    setIsFixing(true)
    try {
      const unfixedIssues = issues.filter(issue => !issue.isFixed)
      
      for (const issue of unfixedIssues) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIssues(prev => prev.map(i => 
          i.id === issue.id ? { ...i, isFixed: true } : i
        ))
      }
      
      setAnalysis(prev => ({
        ...prev,
        issuesFixed: issues.length
      }))
      
      toast.success('All issues fixed successfully!')
    } catch (error) {
      toast.error('Failed to fix some issues')
    } finally {
      setIsFixing(false)
    }
  }

  const getSeverityCount = (severity: string) => {
    return issues.filter(issue => issue.severity === severity && !issue.isFixed).length
  }

  const getIssueTypeCount = (type: string) => {
    return issues.filter(issue => issue.type === type && !issue.isFixed).length
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CogIcon className="h-8 w-8 text-blue-600 mr-3" />
            SEO Agent
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Automatically detect and fix SEO issues across your entire website
          </p>
        </div>

        {/* Mastra Agents Integration */}
        <div className="mb-8">
          <CompetitiveAnalysisForm />
        </div>

        {/* AI Content Generator */}
        <div className="mb-8">
          <ContentGenerator />
        </div>

        {/* Site Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <GlobeAltIcon className="h-5 w-5 text-blue-600 mr-2" />
                Site Analysis
              </CardTitle>
              <CardDescription>
                Enter your website URL to start the SEO analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={startScan} 
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4 mr-2" />
                        Start Scan
                      </>
                    )}
                  </Button>
                </div>

                {analysis.status === 'scanning' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Analyzing pages...</span>
                      <span>{analysis.analyzedPages}/{analysis.totalPages}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(analysis.analyzedPages / analysis.totalPages) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {analysis.status === 'completed' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.totalPages}</div>
                      <div className="text-sm text-gray-500">Total Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analysis.issuesFound}</div>
                      <div className="text-sm text-gray-500">Issues Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.issuesFixed}</div>
                      <div className="text-sm text-gray-500">Issues Fixed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(((analysis.issuesFound - analysis.issuesFixed) / analysis.issuesFound) * 100) || 0}%
                      </div>
                      <div className="text-sm text-gray-500">Remaining</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
                Issue Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Critical</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${severityColors.critical}`}>
                    {getSeverityCount('critical')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${severityColors.high}`}>
                    {getSeverityCount('high')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Medium</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${severityColors.medium}`}>
                    {getSeverityCount('medium')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${severityColors.low}`}>
                    {getSeverityCount('low')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                      SEO Issues
                    </CardTitle>
                    <CardDescription>
                      {issues.filter(issue => !issue.isFixed).length} issues found
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={fixAllIssues} 
                    disabled={isFixing || issues.every(issue => issue.isFixed)}
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Fix All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.map((issue) => {
                    const issueType = issueTypes[issue.type]
                    const IconComponent = issueType.icon
                    
                    return (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedIssue?.id === issue.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${issue.isFixed ? 'opacity-60' : ''}`}
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <IconComponent className={`h-5 w-5 mt-0.5 ${issueType.color}`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {issueType.label}
                                </h3>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${severityColors[issue.severity]}`}>
                                  {issue.severity}
                                </span>
                                {issue.isFixed && (
                                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {issue.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {issue.suggestion}
                              </p>
                            </div>
                          </div>
                          {!issue.isFixed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                fixIssue(issue.id)
                              }}
                            >
                              Fix
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Details */}
          <div className="space-y-6">
            {selectedIssue ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {React.createElement(issueTypes[selectedIssue.type].icon, {
                      className: `h-5 w-5 ${issueTypes[selectedIssue.type].color} mr-2`
                    })}
                    Issue Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Type
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {issueTypes[selectedIssue.type].label}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Severity
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedIssue.severity}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Message
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedIssue.message}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suggestion
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedIssue.suggestion}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedIssue.isFixed ? 'Fixed' : 'Pending'}
                      </p>
                    </div>
                    {!selectedIssue.isFixed && (
                      <Button
                        onClick={() => fixIssue(selectedIssue.id)}
                        className="w-full"
                      >
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Fix This Issue
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select an issue to view details
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Issue Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Issue Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(issueTypes).map(([type, config]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {config.label}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getIssueTypeCount(type)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


