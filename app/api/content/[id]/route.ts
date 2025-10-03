import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

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

// GET /api/content/[id] - Get specific content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        },
        seoIssues: {
          orderBy: { createdAt: 'desc' }
        },
        socialPosts: {
          orderBy: { createdAt: 'desc' }
        },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30
        },
        _count: {
          select: {
            seoIssues: true,
            socialPosts: true,
            analytics: true,
          }
        }
      }
    })

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
  } finally {
    await prisma.$disconnect()
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
    }

    const content = await prisma.content.update({
      where: { id },
      data: dataToUpdate,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            domain: true,
          }
        },
        _count: {
          select: {
            seoIssues: true,
            socialPosts: true,
            analytics: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Content updated successfully',
      content
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    console.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/content/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.content.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Content deleted successfully'
    })

  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}


