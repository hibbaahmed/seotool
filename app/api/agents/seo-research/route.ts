import { NextRequest, NextResponse } from 'next/server';
import { researchAgent } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, brand } = body;

    if (!topic || !brand) {
      return NextResponse.json(
        { success: false, error: 'Topic and brand are required' },
        { status: 400 }
      );
    }

    // Generate SEO research using the research agent
    const result = await researchAgent.generate(
      `Perform keyword research for topic: ${topic} for brand: ${brand}`
    );

    return NextResponse.json({
      success: true,
      research: result.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SEO research error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform SEO research',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


