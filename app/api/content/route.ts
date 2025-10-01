import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['BLOG', 'PAGE', 'PRODUCT']).default('BLOG'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  seoScore: z.number().min(0).max(100).optional(),
  keywords: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
})

// GET /api/content - Get all content for a user or project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: any = { userId }
    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (type) where.type = type

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.content.count({ where })
    ])

    return NextResponse.json({
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

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

// POST /api/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const contentData = contentSchema.parse(body)

    const content = await prisma.content.create({
      data: contentData,
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
      message: 'Content created successfully',
      content
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
  } finally {
    await prisma.$disconnect()
  }
}


