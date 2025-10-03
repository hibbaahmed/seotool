import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  description: z.string().optional(),
  domain: z.string().url('Invalid domain URL').optional(),
})

// Mock data storage (in a real app, this would be a database)
let mockProjects: any[] = [
  {
    id: 'project1',
    name: 'Sample Project',
    description: 'A sample project for testing',
    domain: 'example.com',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: [],
    rssFeeds: [],
    automationRules: [],
    _count: {
      content: 0,
      rssFeeds: 0,
      automationRules: 0
    }
  }
]

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = mockProjects.find(p => p.id === id)

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })

  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const updateData = updateProjectSchema.parse(body)

    const projectIndex = mockProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    const updatedProject = {
      ...mockProjects[projectIndex],
      _count: {
        content: 0,
        rssFeeds: 0,
        automationRules: 0
      }
    }

    return NextResponse.json({
      message: 'Project updated successfully',
      project: updatedProject
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const projectIndex = mockProjects.findIndex(p => p.id === id)
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    mockProjects.splice(projectIndex, 1)

    return NextResponse.json({
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}