import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['BLOG', 'PAGE', 'PRODUCT']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  seoScore: z.number().min(0).max(100).optional(),
  keywords: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
})

// Mock data storage (in a real app, this would be a database)
let mockContent: any[] = [
  {
    id: '1',
    title: 'Sample Blog Post',
    content: 'This is a sample blog post content...',
    type: 'BLOG',
    status: 'PUBLISHED',
    seoScore: 85,
    keywords: ['seo', 'blog', 'content'],
    metaTitle: 'Sample Meta Title',
    metaDescription: 'Sample meta description',
    canonicalUrl: 'https://example.com/post1',
    publishedAt: new Date().toISOString(),
    userId: 'user1',
    projectId: 'project1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: {
      id: 'project1',
      name: 'Sample Project',
      domain: 'example.com'
    },
    seoIssues: [],
    socialPosts: [],
    analytics: [],
    _count: {
      seoIssues: 0,
      socialPosts: 0,
      analytics: 0
    }
  }
]

// GET /api/content/[id] - Get specific content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = mockContent.find(item => item.id === id)

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ content })

  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/content/[id] - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const updateData = updateContentSchema.parse(body)

    // Convert publishedAt string to Date if provided
    const dataToUpdate: any = { ...updateData }
    if (dataToUpdate.publishedAt) {
      dataToUpdate.publishedAt = new Date(dataToUpdate.publishedAt)
    } else if (dataToUpdate.publishedAt) {
      dataToUpdate.publishedAt = new Date(dataToUpdate.publishedAt).toISOString()
    }

    // Find and update content
    const contentIndex = mockContent.findIndex(item => item.id === id)
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    mockContent[contentIndex] = {
      ...mockContent[contentIndex],
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    }

    const updatedContent = {
      ...mockContent[contentIndex],
      project: {
        id: 'project1',
        name: 'Sample Project',
        domain: 'example.com'
      },
      _count: {
        seoIssues: 0,
        socialPosts: 0,
        analytics: 0
      }
    }

    return NextResponse.json({
      message: 'Content updated successfully',
      content: updatedContent
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const contentIndex = mockContent.findIndex(item => item.id === id)
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    mockContent.splice(contentIndex, 1)

    return NextResponse.json({
      message: 'Content deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}