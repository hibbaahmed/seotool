import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, contentId } = analyzeSchema.parse(body)

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEOFlow Bot 1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch the webpage' },
        { status: 400 }
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const issues: SEOIssue[] = []

    // Analyze meta title
    const metaTitle = $('title').text()
    if (!metaTitle) {
      issues.push({
        type: 'META_TITLE',
        severity: 'high',
        message: 'Missing meta title',
        suggestion: 'Add a descriptive meta title (50-60 characters)'
      })
    } else if (metaTitle.length > 60) {
      issues.push({
        type: 'META_TITLE',
        severity: 'medium',
        message: 'Meta title too long',
        suggestion: `Shorten meta title to under 60 characters (current: ${metaTitle.length})`
      })
    } else if (metaTitle.length < 30) {
      issues.push({
        type: 'META_TITLE',
        severity: 'low',
        message: 'Meta title too short',
        suggestion: 'Consider expanding meta title to 30-60 characters'
      })
    }

    // Analyze meta description
    const metaDescription = $('meta[name="description"]').attr('content')
    if (!metaDescription) {
      issues.push({
        type: 'META_DESCRIPTION',
        severity: 'high',
        message: 'Missing meta description',
        suggestion: 'Add a compelling meta description (150-160 characters)'
      })
    } else if (metaDescription.length > 160) {
      issues.push({
        type: 'META_DESCRIPTION',
        severity: 'medium',
        message: 'Meta description too long',
        suggestion: `Shorten meta description to under 160 characters (current: ${metaDescription.length})`
      })
    } else if (metaDescription.length < 120) {
      issues.push({
        type: 'META_DESCRIPTION',
        severity: 'low',
        message: 'Meta description too short',
        suggestion: 'Consider expanding meta description to 120-160 characters'
      })
    }

    // Analyze canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href')
    if (!canonicalUrl) {
      issues.push({
        type: 'CANONICAL_URL',
        severity: 'high',
        message: 'Missing canonical URL',
        suggestion: 'Add canonical URL to prevent duplicate content issues'
      })
    }

    // Analyze images without alt text
    const imagesWithoutAlt = $('img:not([alt])').length
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'ALT_TEXT',
        severity: 'medium',
        message: `${imagesWithoutAlt} images missing alt text`,
        suggestion: 'Add descriptive alt text to all images for accessibility and SEO'
      })
    }

    // Analyze heading structure
    const h1Count = $('h1').length
    if (h1Count === 0) {
      issues.push({
        type: 'HEADING_STRUCTURE',
        severity: 'high',
        message: 'Missing H1 heading',
        suggestion: 'Add a single H1 heading to establish page hierarchy'
      })
    } else if (h1Count > 1) {
      issues.push({
        type: 'HEADING_STRUCTURE',
        severity: 'medium',
        message: 'Multiple H1 headings found',
        suggestion: 'Use only one H1 heading per page for better SEO'
      })
    }

    // Analyze internal links
    const internalLinks = $('a[href^="/"], a[href*="' + new URL(url).hostname + '"]').length
    if (internalLinks === 0) {
      issues.push({
        type: 'INTERNAL_LINKING',
        severity: 'low',
        message: 'No internal links found',
        suggestion: 'Add relevant internal links to improve site structure and SEO'
      })
    }

    // Analyze schema markup
    const schemaMarkup = $('script[type="application/ld+json"]').length
    if (schemaMarkup === 0) {
      issues.push({
        type: 'SCHEMA_MARKUP',
        severity: 'medium',
        message: 'No structured data found',
        suggestion: 'Add JSON-LD schema markup for better search visibility'
      })
    }

    // Calculate SEO score
    const totalIssues = issues.length
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const mediumIssues = issues.filter(i => i.severity === 'medium').length
    const lowIssues = issues.filter(i => i.severity === 'low').length

    let seoScore = 100
    seoScore -= criticalIssues * 20
    seoScore -= highIssues * 15
    seoScore -= mediumIssues * 10
    seoScore -= lowIssues * 5
    seoScore = Math.max(0, seoScore)

    // Save issues to database if contentId is provided
    if (contentId && issues.length > 0) {
      await prisma.sEOIssue.createMany({
        data: issues.map(issue => ({
          type: issue.type as any,
          severity: issue.severity as any,
          message: issue.message,
          suggestion: issue.suggestion,
          contentId,
          isFixed: false,
        }))
      })

      // Update content SEO score
      await prisma.content.update({
        where: { id: contentId },
        data: { seoScore }
      })
    }

    return NextResponse.json({
      message: 'SEO analysis completed',
      url,
      seoScore,
      issues,
      summary: {
        total: totalIssues,
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
      },
      recommendations: {
        priority: criticalIssues > 0 ? 'critical' : highIssues > 0 ? 'high' : 'medium',
        estimatedTime: Math.ceil(totalIssues * 0.5), // 30 minutes per issue
      }
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
  } finally {
    await prisma.$disconnect()
  }
}


