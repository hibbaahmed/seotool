import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  domain: z.string().url('Invalid domain URL'),
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
    updatedAt: new Date().toISOString()
  }
]

// GET /api/projects - Get all projects for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const projects = mockProjects.filter(project => project.userId === userId)

    return NextResponse.json({ projects })

  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const projectData = projectSchema.parse(body)

    // In a real app, you'd get this from authentication
    const userId = 'user1'

    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockProjects.push(newProject)

    return NextResponse.json({
      message: 'Project created successfully',
      project: newProject
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}