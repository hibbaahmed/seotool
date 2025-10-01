/**
 * Core types for the SEO Automation Platform
 */

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  domain: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Content {
  id: string
  title: string
  content: string
  type: 'blog' | 'page' | 'product'
  status: 'draft' | 'published' | 'scheduled'
  projectId: string
  userId: string
  seoScore?: number
  keywords: string[]
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface SEOIssue {
  id: string
  type: 'meta_title' | 'meta_description' | 'canonical_url' | 'alt_text' | 'internal_linking' | 'schema_markup'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  suggestion: string
  contentId: string
  isFixed: boolean
  createdAt: Date
}

export interface ContentGenerationRequest {
  topic: string
  keywords: string[]
  language: string
  tone: 'professional' | 'casual' | 'technical' | 'creative'
  length: 'short' | 'medium' | 'long'
  includeImages: boolean
  includeVideo: boolean
  includeTableOfContents: boolean
  targetAudience: string
}

export interface SocialMediaPost {
  id: string
  content: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram'
  scheduledAt?: Date
  publishedAt?: Date
  status: 'draft' | 'scheduled' | 'published'
  contentId: string
  userId: string
}

export interface Analytics {
  id: string
  contentId: string
  views: number
  clicks: number
  impressions: number
  ctr: number
  position: number
  date: Date
}

export interface RSSFeed {
  id: string
  name: string
  url: string
  projectId: string
  isActive: boolean
  lastFetched?: Date
  createdAt: Date
}

export interface AutomationRule {
  id: string
  name: string
  trigger: 'rss_feed' | 'keyword' | 'schedule'
  action: 'generate_content' | 'publish' | 'share_social'
  config: Record<string, any>
  projectId: string
  isActive: boolean
  createdAt: Date
}


