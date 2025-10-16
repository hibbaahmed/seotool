import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const userInput = messages[messages.length - 1]?.content || '';
    
    // Enhanced prompt for SEO research
    const systemPrompt = `You are an expert SEO research specialist. Analyze the following request and provide comprehensive SEO research and keyword analysis.

Include these sections:
1. **Primary Keywords** - Main target keywords with search volume estimates
2. **Long-tail Keywords** - Specific, less competitive keywords
3. **Keyword Difficulty** - Competition analysis for each keyword
4. **Content Ideas** - Blog post topics based on keyword research
5. **Competitor Keywords** - What keywords competitors are ranking for
6. **Local SEO Opportunities** - If applicable, local search terms
7. **Technical SEO Recommendations** - Site structure, meta tags, etc.
8. **Link Building Opportunities** - Backlink strategies

Format your response with clear sections, keyword lists, and actionable SEO strategies.`;

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
    console.error('SEO research error:', error);
    return NextResponse.json({ error: 'Research failed' }, { status: 500 });
  }
}
