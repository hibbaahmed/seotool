import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const userInput = messages[messages.length - 1]?.content || '';
    
    // Enhanced prompt for content writing
    const systemPrompt = `You are an expert content writer and SEO specialist. Create high-quality, engaging content based on the following request.

Your content should:
- Be well-structured with clear headings and subheadings
- Include relevant keywords naturally
- Be engaging and valuable to readers
- Include internal linking suggestions
- Be optimized for SEO
- Include a compelling introduction and conclusion
- Use bullet points and numbered lists where appropriate
- Be between 1000-2000 words for blog posts

Format your response with:
1. **Title** - SEO-optimized headline
2. **Meta Description** - 150-160 characters
3. **Content** - Full article with proper structure
4. **SEO Suggestions** - Internal links, images, etc.
5. **Call-to-Action** - Engaging conclusion with CTA

Make the content informative, engaging, and optimized for search engines.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userInput }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', value: parsed.delta.text })}\n\n`));
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Content writing error:', error);
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}
