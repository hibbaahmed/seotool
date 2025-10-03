import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as cheerio from 'cheerio'

const analyzeSchema = z.object({
  url: z.string().url('Invalid URL'),
  contentId: z.string().optional(),
})

interface SEOIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  suggestion: string
}

interface SEOAnalysisResult {
  url: string
  title: string
  description: string
  h1Count: number
  h2Count: number
  imagesCount: number
  imagesWithAlt: number
  internalLinks: number
  externalLinks: number
  wordCount: number
  readingTime: number
  issues: SEOIssue[]
  overallScore: number
  recommendations: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, contentId } = analyzeSchema.parse(body)

    // Fetch the webpage
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch the URL' },
        { status: 400 }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract basic SEO data
    const title = $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || ''
    const h1Count = $('h1').length
    const h2Count = $('h2').length
    const imagesCount = $('img').length
    const imagesWithAlt = $('img[alt]').length
    const internalLinks = $('a[href^="/"], a[href^="#"]').length
    const externalLinks = $('a[href^="http"]').length

    // Calculate word count from visible text
    const visibleText = $('body').text().replace(/\s+/g, ' ').trim()
    const wordCount = visibleText.split(' ').filter(word => word.length > 0).length
    const readingTime = Math.ceil(wordCount / 200) // Average reading speed: 200 WPM

    // Analyze for SEO issues
    const issues: SEOIssue[] = []

    // Check title
    if (!title) {
      issues.push({
        type: 'missing-title',
        severity: 'critical',
        message: 'Page title is missing',
        suggestion: 'Add a descriptive title tag to improve SEO and user experience'
      })
    } else if (title.length < 30) {
      issues.push({
        type: 'short-title',
        severity: 'medium',
        message: 'Title is too short',
        suggestion: 'Optimize title length to 30-60 characters for better SEO'
      })
    } else if (title.length > 60) {
      issues.push({
        type: 'long-title',
        severity: 'low',
        message: 'Title is too long',
        suggestion: 'Shorten title to under 60 characters to avoid truncation in search results'
      })
    }

    // Check meta description
    if (!description) {
      issues.push({
        type: 'missing-description',
        severity: 'high',
        message: 'Meta description is missing',
        suggestion: 'Add a meta description to improve click-through rates from search results'
      })
    } else if (description.length < 120) {
      issues.push({
        type: 'short-description',
        severity: 'medium',
        message: 'Meta description is too short',
        suggestion: 'Optimize description to 120-160 characters for better search snippets'
      })
    } else if (description.length > 160) {
      issues.push({
        type: 'long-description',
        severity: 'low',
        message: 'Meta description is too long',
        suggestion: 'Shorten description to avoid truncation in search results'
      })
    }

    // Check H1 tags
    if (h1Count === 0) {
      issues.push({
        type: 'missing-h1',
        severity: 'high',
        message: 'No H1 heading found',
        suggestion: 'Add a single H1 tag to structure your content hierarchy'
      })
    } else if (h1Count > 1) {
      issues.push({
        type: 'multiple-h1',
        severity: 'medium',
        message: `Found ${h1Count} H1 headings`,
        suggestion: 'Use only one H1 tag per page for better content structure'
      })
    }

    // Check images
    if (imagesCount > 0 && imagesWithAlt < imagesCount * 0.8) {
      issues.push({
        type: 'missing-alt-tags',
        severity: 'medium',
        message: `${imagesCount - imagesWithAlt} images missing alt text`,
        suggestion: 'Add descriptive alt text to all images for accessibility and SEO'
      })
    }

    // Check content length
    if (wordCount < 300) {
      issues.push({
        type: 'thin-content',
        severity: 'medium',
        message: 'Content appears thin (less than 300 words)',
        suggestion: 'Add more valuable content to improve SEO performance'
      })
    }

    // Calculate overall SEO score
    let score = 100
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 20; break
        case 'high': score -= 15; break
        case 'medium': score -= 10; break
        case 'low': score -= 5; break
      }
    })
    
    const overallScore = Math.max(0, Math.min(100, score))

    // Generate recommendations
    const recommendations: string[] = []
    if (title) recommendations.push('✅ Title is present')
    else recommendations.push('❌ Add a descriptive title')
    
    if (description) recommendations.push('✅ Meta description is present')
    else recommendations.push('❌ Add a meta description')
    
    if (h1Count === 1) recommendations.push('✅ Proper H1 structure')
    else recommendations.push('❌ Use exactly one H1 tag')
    
    if (wordCount >= 300) recommendations.push('✅ Sufficient content length')
    else recommendations.push('❌ Add more content (300+ words recommended)')

    const result: SEOAnalysisResult = {
      url,
      title,
      description,
      h1Count,
      h2Count,
      imagesCount,
      imagesWithAlt,
      internalLinks,
      externalLinks,
      wordCount,
      readingTime,
      issues,
      overallScore,
      recommendations
    }

    // In a real app, you'd save this to a database
    console.log('SEO Analysis completed:', result)

    return NextResponse.json({
      message: 'SEO analysis completed successfully',
      data: result
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error analyzing SEO:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}