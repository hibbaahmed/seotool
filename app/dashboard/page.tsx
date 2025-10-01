'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  LinkIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UsersIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Project, Content, Analytics } from '@/lib/types'
import { formatNumber, formatDate } from '@/lib/utils'

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Tech Startup Blog',
    description: 'Main company blog for tech startup',
    domain: 'techstartup.com',
    userId: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'E-commerce Store',
    description: 'Product pages and blog content',
    domain: 'mystore.com',
    userId: 'user-1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: '3',
    name: 'Agency Client Site',
    description: 'Client website optimization',
    domain: 'clientagency.com',
    userId: 'user-1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-13')
  }
]

const mockContent: Content[] = [
  {
    id: '1',
    title: 'Ultimate Guide to SEO in 2024',
    content: 'Comprehensive guide covering latest SEO strategies...',
    type: 'blog',
    status: 'published',
    projectId: '1',
    userId: 'user-1',
    seoScore: 85,
    keywords: ['SEO', 'search optimization', 'digital marketing'],
    metaTitle: 'Ultimate Guide to SEO in 2024',
    metaDescription: 'Learn the latest SEO strategies for 2024',
    canonicalUrl: 'https://techstartup.com/seo-guide-2024',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    publishedAt: new Date('2024-01-12')
  },
  {
    id: '2',
    title: 'AI-Powered Content Marketing',
    content: 'How artificial intelligence is transforming content marketing...',
    type: 'blog',
    status: 'draft',
    projectId: '1',
    userId: 'user-1',
    seoScore: 72,
    keywords: ['AI', 'content marketing', 'automation'],
    metaTitle: 'AI-Powered Content Marketing Strategies',
    metaDescription: 'Discover how AI is revolutionizing content marketing',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    title: 'Product Page - Premium Headphones',
    content: 'High-quality wireless headphones with noise cancellation...',
    type: 'product',
    status: 'published',
    projectId: '2',
    userId: 'user-1',
    seoScore: 78,
    keywords: ['headphones', 'wireless', 'noise cancellation'],
    metaTitle: 'Premium Wireless Headphones - Noise Cancelling',
    metaDescription: 'Experience premium sound with our wireless noise-cancelling headphones',
    canonicalUrl: 'https://mystore.com/premium-headphones',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14'),
    publishedAt: new Date('2024-01-10')
  }
]

const mockAnalytics: Analytics[] = [
  {
    id: '1',
    contentId: '1',
    views: 1250,
    clicks: 89,
    impressions: 5600,
    ctr: 1.59,
    position: 12.5,
    date: new Date('2024-01-15')
  },
  {
    id: '2',
    contentId: '3',
    views: 890,
    clicks: 45,
    impressions: 3200,
    ctr: 1.41,
    position: 15.2,
    date: new Date('2024-01-15')
  }
]

const recentActivities = [
  {
    id: '1',
    type: 'content_published',
    message: 'Published "Ultimate Guide to SEO in 2024"',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    project: 'Tech Startup Blog'
  },
  {
    id: '2',
    type: 'seo_optimized',
    message: 'Fixed 5 SEO issues on Product Page',
    timestamp: new Date('2024-01-15T09:15:00Z'),
    project: 'E-commerce Store'
  },
  {
    id: '3',
    type: 'content_generated',
    message: 'Generated 3 blog posts from RSS feeds',
    timestamp: new Date('2024-01-15T08:45:00Z'),
    project: 'Agency Client Site'
  },
  {
    id: '4',
    type: 'social_shared',
    message: 'Shared content to 5 social platforms',
    timestamp: new Date('2024-01-14T16:20:00Z'),
    project: 'Tech Startup Blog'
  }
]

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  const totalViews = mockAnalytics.reduce((sum, analytics) => sum + analytics.views, 0)
  const totalClicks = mockAnalytics.reduce((sum, analytics) => sum + analytics.clicks, 0)
  const totalImpressions = mockAnalytics.reduce((sum, analytics) => sum + analytics.impressions, 0)
  const averageCTR = mockAnalytics.reduce((sum, analytics) => sum + analytics.ctr, 0) / mockAnalytics.length
  const averagePosition = mockAnalytics.reduce((sum, analytics) => sum + analytics.position, 0) / mockAnalytics.length

  const publishedContent = mockContent.filter(c => c.status === 'published').length
  const draftContent = mockContent.filter(c => c.status === 'draft').length
  const scheduledContent = mockContent.filter(c => c.status === 'scheduled').length

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'content_published': return DocumentTextIcon
      case 'seo_optimized': return CogIcon
      case 'content_generated': return CalendarIcon
      case 'social_shared': return LinkIcon
      default: return CheckCircleIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'content_published': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'seo_optimized': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200'
      case 'content_generated': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200'
      case 'social_shared': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Overview of your SEO automation performance and content management
          </p>
        </div>

        {/* Project Selector and Time Range */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {mockProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalViews)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                  <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+12.5%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(totalClicks)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                  <LinkIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+8.3%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CTR</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageCTR.toFixed(2)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+0.3%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Position</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averagePosition.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full dark:bg-orange-900">
                  <GlobeAltIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">-2.1</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Projects Overview</CardTitle>
                    <CardDescription>
                      Manage your SEO projects and content
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {project.domain}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {mockContent.filter(c => c.projectId === project.id).length}
                          </div>
                          <div className="text-xs text-gray-500">Content</div>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>
                  Top performing content pieces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockContent.filter(c => c.status === 'published').map((content) => {
                    const analytics = mockAnalytics.find(a => a.contentId === content.id)
                    return (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {content.title}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              {analytics?.views || 0} views
                            </span>
                            <span className="flex items-center">
                              <LinkIcon className="h-4 w-4 mr-1" />
                              {analytics?.clicks || 0} clicks
                            </span>
                            <span className="flex items-center">
                              <GlobeAltIcon className="h-4 w-4 mr-1" />
                              Pos. {analytics?.position?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {content.seoScore}/100
                          </div>
                          <div className="text-xs text-gray-500">SEO Score</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Content Status */}
            <Card>
              <CardHeader>
                <CardTitle>Content Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Published</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {publishedContent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Draft</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {draftContent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {scheduledContent}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type)
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.project} • {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
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
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CogIcon className="h-4 w-4 mr-2" />
                    Run SEO Scan
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule Posts
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    View Analytics
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
