import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/lib/mastra';

export async function POST(req: NextRequest) {
  try {
    const { prompt, agent } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt format' }, { status: 400 });
    }

    console.log('📨 Received research generation request:', { 
      prompt: prompt.substring(0, 100) + '...',
      agent 
    });
    
    const agentInstance = mastra.getAgent('researchAgent');
    if (!agentInstance) {
      console.error('❌ researchAgent not found in mastra instance');
      return NextResponse.json({ error: 'researchAgent not found' }, { status: 500 });
    }

    console.log('✅ Found researchAgent, starting research...');
    
    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const agentStream = await agentInstance.stream([
            {
              role: 'user',
              content: `Please conduct SEO research based on this request: ${prompt}. Provide detailed keyword analysis, search volume insights, and competitive intelligence.`
            }
          ]);
          
          let tokenCount = 0;

          for await (const chunk of agentStream.textStream) {
            tokenCount++;
            const data = `data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          console.log(`✅ Research completed, sent ${tokenCount} tokens`);
          
          // Send completion signal
          const doneData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(doneData));
          controller.close();
        } catch (error) {
          console.error('❌ Research error:', error);
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
    console.error('❌ Research generation API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

