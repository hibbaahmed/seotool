import { NextRequest, NextResponse } from 'next/server';
import { competitiveAnalysisAgent } from '@/lib/agents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, keywords, competitors, analysisType } = body;

    // Generate analysis using the competitive analysis agent
    const result = await competitiveAnalysisAgent.generate(
      `Analyze the competitive landscape for: ${topic}. 
       Keywords: ${keywords?.join(', ') || 'Not specified'}
       Competitors: ${competitors?.join(', ') || 'Not specified'}
       Analysis Type: ${analysisType || 'content-gaps'}`
    );

    return NextResponse.json({
      success: true,
      analysis: result.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Competitive analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform competitive analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


