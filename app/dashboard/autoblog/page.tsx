'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  CalendarIcon,
  RssIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  DocumentTextIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon,
  TagIcon,
  GlobeAltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { RSSFeed, AutomationRule } from '@/lib/types'
import toast from 'react-hot-toast'

interface ScheduledPost {
  id: string
  title: string
  content: string
  source: 'rss' | 'keyword' | 'manual'
  scheduledAt: Date
  status: 'scheduled' | 'published' | 'failed'
  platform: 'blog' | 'social'
}

const mockFeeds: RSSFeed[] = [
  {
    id: '1',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    projectId: 'project-1',
    isActive: true,
    lastFetched: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: '2',
    name: 'Moz Blog',
    url: 'https://moz.com/blog/feed',
    projectId: 'project-1',
    isActive: true,
    lastFetched: new Date('2024-01-15T09:15:00Z'),
    createdAt: new Date('2024-01-05T00:00:00Z')
  },
  {
    id: '3',
    name: 'Search Engine Journal',
    url: 'https://www.searchenginejournal.com/feed/',
    projectId: 'project-1',
    isActive: false,
    lastFetched: new Date('2024-01-14T16:45:00Z'),
    createdAt: new Date('2024-01-10T00:00:00Z')
  }
]

const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Tech News Auto-Blog',
    trigger: 'rss_feed',
    action: 'generate_content',
    config: {
      feedId: '1',
      keywords: ['AI', 'technology', 'startup'],
      frequency: 'daily',
      maxPosts: 3
    },
    projectId: 'project-1',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: '2',
    name: 'SEO Tips Automation',
    trigger: 'keyword',
    action: 'publish',
    config: {
      keywords: ['SEO tips', 'search optimization'],
      frequency: 'weekly',
      tone: 'professional'
    },
    projectId: 'project-1',
    isActive: true,
    createdAt: new Date('2024-01-05T00:00:00Z')
  }
]

const mockScheduledPosts: ScheduledPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Digital Marketing',
    content: 'Artificial intelligence is revolutionizing how businesses approach digital marketing...',
    source: 'rss',
    scheduledAt: new Date('2024-01-16T10:00:00Z'),
    status: 'scheduled',
    platform: 'blog'
  },
  {
    id: '2',
    title: '5 Essential SEO Tips for 2024',
    content: 'Stay ahead of the competition with these proven SEO strategies...',
    source: 'keyword',
    scheduledAt: new Date('2024-01-16T14:30:00Z'),
    status: 'scheduled',
    platform: 'social'
  },
  {
    id: '3',
    title: 'How to Optimize Your Website Speed',
    content: 'Website speed is a crucial ranking factor. Here are the best practices...',
    source: 'manual',
    scheduledAt: new Date('2024-01-15T16:00:00Z'),
    status: 'published',
    platform: 'blog'
  }
]

export default function AutoblogPage() {
  const [feeds, setFeeds] = useState<RSSFeed[]>(mockFeeds)
  const [rules, setRules] = useState<AutomationRule[]>(mockRules)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(mockScheduledPosts)
  const [activeTab, setActiveTab] = useState<'feeds' | 'rules' | 'posts' | 'analytics'>('feeds')
  const [isAddingFeed, setIsAddingFeed] = useState(false)
  const [newFeed, setNewFeed] = useState({ name: '', url: '' })
  const [isProcessing, setIsProcessing] = useState(false)

  const addFeed = async () => {
    if (!newFeed.name.trim() || !newFeed.url.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const feed: RSSFeed = {
        id: Date.now().toString(),
        name: newFeed.name,
        url: newFeed.url,
        projectId: 'project-1',
        isActive: true,
        createdAt: new Date()
      }
      
      setFeeds(prev => [...prev, feed])
      setNewFeed({ name: '', url: '' })
      setIsAddingFeed(false)
      toast.success('RSS feed added successfully!')
    } catch (error) {
      toast.error('Failed to add RSS feed')
    }
  }

  const toggleFeed = async (feedId: string) => {
    setFeeds(prev => prev.map(feed => 
      feed.id === feedId ? { ...feed, isActive: !feed.isActive } : feed
    ))
    toast.success('Feed status updated!')
  }

  const deleteFeed = async (feedId: string) => {
    setFeeds(prev => prev.filter(feed => feed.id !== feedId))
    toast.success('Feed deleted successfully!')
  }

  const fetchFeeds = async () => {
    setIsProcessing(true)
    try {
      // Simulate fetching
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setFeeds(prev => prev.map(feed => ({
        ...feed,
        lastFetched: new Date()
      })))
      
      toast.success('All feeds fetched successfully!')
    } catch (error) {
      toast.error('Failed to fetch feeds')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
    toast.success('Rule status updated!')
  }

  const deletePost = async (postId: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== postId))
    toast.success('Post deleted successfully!')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'rss': return RssIcon
      case 'keyword': return TagIcon
      case 'manual': return DocumentTextIcon
      default: return DocumentTextIcon
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
            Autoblog & Content Automation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Automate content generation from RSS feeds, keywords, and schedule posts
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'feeds', label: 'RSS Feeds', icon: RssIcon },
                { id: 'rules', label: 'Automation Rules', icon: CogIcon },
                { id: 'posts', label: 'Scheduled Posts', icon: ClockIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* RSS Feeds Tab */}
        {activeTab === 'feeds' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                RSS Feeds
              </h2>
              <div className="flex gap-2">
                <Button onClick={fetchFeeds} loading={isProcessing} variant="outline">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Fetch All
                </Button>
                <Button onClick={() => setIsAddingFeed(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Feed
                </Button>
              </div>
            </div>

            {isAddingFeed && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New RSS Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Feed Name"
                      placeholder="e.g., TechCrunch"
                      value={newFeed.name}
                      onChange={(e) => setNewFeed(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      label="Feed URL"
                      placeholder="https://example.com/feed.xml"
                      value={newFeed.url}
                      onChange={(e) => setNewFeed(prev => ({ ...prev, url: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={addFeed}>Add Feed</Button>
                      <Button variant="outline" onClick={() => setIsAddingFeed(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeds.map((feed) => (
                <Card key={feed.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <RssIcon className="h-5 w-5 text-orange-600 mr-2" />
                        {feed.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFeed(feed.id)}
                          className={`w-8 h-4 rounded-full transition-colors ${
                            feed.isActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                            feed.isActive ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                        <button
                          onClick={() => deleteFeed(feed.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <CardDescription className="break-all">
                      {feed.url}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          feed.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {feed.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Last Fetched</span>
                        <span className="text-gray-900 dark:text-white">
                          {feed.lastFetched ? new Date(feed.lastFetched).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Automation Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Automation Rules
              </h2>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <CogIcon className="h-5 w-5 text-blue-600 mr-2" />
                        {rule.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className={`w-8 h-4 rounded-full transition-colors ${
                            rule.isActive ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                            rule.isActive ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    </div>
                    <CardDescription>
                      {rule.trigger} → {rule.action}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Trigger</span>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {rule.trigger.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Action</span>
                        <span className="text-gray-900 dark:text-white capitalize">
                          {rule.action.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          rule.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {rule.config.keywords && (
                        <div>
                          <span className="text-sm text-gray-500">Keywords</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.config.keywords.map((keyword: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Scheduled Posts
              </h2>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Schedule Post
              </Button>
            </div>

            <div className="space-y-4">
              {scheduledPosts.map((post) => {
                const SourceIcon = getSourceIcon(post.source)
                return (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <SourceIcon className="h-4 w-4 text-gray-500" />
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {post.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {new Date(post.scheduledAt).toLocaleString()}
                            </span>
                            <span className="flex items-center">
                              <GlobeAltIcon className="h-4 w-4 mr-1" />
                              {post.platform}
                            </span>
                            <span className="capitalize">
                              {post.source}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {post.status === 'scheduled' && (
                            <Button size="sm" variant="outline">
                              <PlayIcon className="h-4 w-4 mr-1" />
                              Publish Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deletePost(post.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Automation Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {scheduledPosts.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Posts</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {scheduledPosts.filter(p => p.status === 'published').length}
                    </div>
                    <div className="text-sm text-gray-500">Published</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {scheduledPosts.filter(p => p.status === 'scheduled').length}
                    </div>
                    <div className="text-sm text-gray-500">Scheduled</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {scheduledPosts.filter(p => p.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Posts by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['rss', 'keyword', 'manual'].map((source) => (
                      <div key={source} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {source}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {scheduledPosts.filter(p => p.source === source).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Posts by Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['blog', 'social'].map((platform) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {platform}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {scheduledPosts.filter(p => p.platform === platform).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


