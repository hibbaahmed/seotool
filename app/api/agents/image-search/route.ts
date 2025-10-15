import { mastra } from '@/lib/mastra';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('🖼️ Received image search request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('imageSearchAgent');
    if (!agent) {
      console.error('❌ imageSearchAgent not found in mastra instance');
      return NextResponse.json({ error: 'imageSearchAgent not found' }, { status: 500 });
    }

    console.log('✅ Found imageSearchAgent, starting stream...');
    const stream = await agent.streamVNext(messages.map(msg => msg.content));

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        let tokenCount = 0;
        
        try {
          for await (const chunk of stream.textStream) {
            tokenCount++;
            const data = `data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          console.log(`✅ Image search stream completed, sent ${tokenCount} tokens`);
          const doneData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('❌ Image search error:', message, err);
          const errorData = `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Image search error:', message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
