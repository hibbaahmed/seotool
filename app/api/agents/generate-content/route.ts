import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/lib/mastra';

export async function POST(req: NextRequest) {
  try {
    const { prompt, agent } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt format' }, { status: 400 });
    }

    console.log('📨 Received content generation request:', { 
      prompt: prompt.substring(0, 100) + '...',
      agent 
    });
    
    const agentInstance = mastra.getAgent('contentWriterAgent');
    if (!agentInstance) {
      console.error('❌ contentWriterAgent not found in mastra instance');
      return NextResponse.json({ error: 'contentWriterAgent not found' }, { status: 500 });
    }

    console.log('✅ Found contentWriterAgent, starting generation...');
    
    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentStream = await agentInstance.stream([
            {
              role: 'user',
              content: `Please generate content based on this request: ${prompt}. Make sure to provide comprehensive, well-structured content that addresses the user's needs.`
            }
          ]);
          
          let tokenCount = 0;

          for await (const chunk of agentStream.textStream) {
            tokenCount++;
            const data = `data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          console.log(`✅ Generation completed, sent ${tokenCount} tokens`);
          
          // Send completion signal
          const doneData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(doneData));
          controller.close();
        } catch (error) {
          console.error('❌ Generation error:', error);
          const errorData = `data: ${JSON.stringify({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ Content generation API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

