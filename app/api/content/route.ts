import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  seoScore: z.number().min(0).max(100).optional(),
  keywords: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
})

// Mock data storage (in a real app, this would be a database)
let mockContent: any[] = []

// GET /api/content - Get all content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let filteredContent = [...mockContent]

    if (projectId) {
      filteredContent = filteredContent.filter(item => item.projectId === projectId)
    }

    if (status) {
      filteredContent = filteredContent.filter(item => item.status === status)
    }

    const totalCount = filteredContent.length
    const totalPages = Math.ceil(totalCount / limit)
    const offset = (page - 1) * limit
    const paginatedContent = filteredContent.slice(offset, offset + limit)

    return NextResponse.json({
      content: paginatedContent,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const contentData = contentSchema.parse(body)

    const newContent = {
      id: Math.random().toString(36).substr(2, 9),
      ...contentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: contentData.status === 'PUBLISHED' ? new Date().toISOString() : null,
    }

    mockContent.push(newContent)

    return NextResponse.json({
      message: 'Content created successfully',
      content: newContent
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}