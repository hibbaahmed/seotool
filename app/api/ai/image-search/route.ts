import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const userInput = messages[messages.length - 1]?.content || '';
    
    // Extract search query from user input - get the actual query from the form data
    const searchQuery = userInput.includes('Query: "') 
      ? userInput.match(/Query: "([^"]+)"/)?.[1] || userInput.replace(/search for images of|find images of|images of/gi, '').trim()
      : userInput.replace(/search for images of|find images of|images of/gi, '').trim();
    
    let imageUrls: string[] = [];
    
    // Try Tavily API for image search if available
    if (process.env.TAVILY_API_KEY) {
        try {
          console.log('🔍 Searching for images with Tavily:', searchQuery);
          console.log('🔑 TAVILY_API_KEY present:', !!process.env.TAVILY_API_KEY);
          const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: searchQuery,
            search_depth: 'basic',
            include_images: true,
            max_results: 10
          })
        });

        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          console.log('📊 Tavily response:', tavilyData);
          
          if (tavilyData.images && tavilyData.images.length > 0) {
            imageUrls = tavilyData.images.filter(Boolean);
            console.log('🖼️ Found images:', imageUrls);
          } else {
            console.log('❌ No images found in Tavily response');
            console.log('🔍 Tavily data structure:', Object.keys(tavilyData));
          }
        } else {
          console.error('❌ Tavily API error:', tavilyResponse.status, tavilyResponse.statusText);
        }
      } catch (error) {
        console.error('❌ Tavily search error:', error);
      }
    } else {
      console.log('⚠️ TAVILY_API_KEY not configured');
      
      // Fallback: Try Unsplash API for images
      try {
        console.log('🔄 Trying Unsplash fallback for:', searchQuery);
        const unsplashResponse = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=10&client_id=${process.env.UNSPLASH_ACCESS_KEY || 'demo'}`);
        
        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          if (unsplashData.results && unsplashData.results.length > 0) {
            imageUrls = unsplashData.results.map((img: any) => img.urls?.regular || img.urls?.small).filter(Boolean);
            console.log('🖼️ Found Unsplash images:', imageUrls);
          }
        }
      } catch (error) {
        console.error('❌ Unsplash fallback error:', error);
      }
      
      // Final fallback: Use demo images for testing
      if (imageUrls.length === 0) {
        console.log('🔄 Using demo images as final fallback');
        imageUrls = [
          'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
          'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=500',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500'
        ];
      }
    }

    // Enhanced prompt for image search with AI analysis
    const systemPrompt = `You are an expert at finding and analyzing images for content. Based on the user's request, provide:

1. **Image Search Results** - Found relevant images
2. **Image Analysis** - Describe what types of images would work best
3. **Usage Suggestions** - How to use these images in content
4. **Alternative Search Terms** - Other keywords to find better images
5. **Image SEO Tips** - How to optimize images for search engines

Be specific about image types, styles, and usage recommendations.`;

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
        max_tokens: 2000,
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
        try {
          // Send images first if we found any
          if (imageUrls.length > 0) {
            const imagesData = `data: ${JSON.stringify({ type: 'images', urls: imageUrls })}\n\n`;
            controller.enqueue(encoder.encode(imagesData));
            console.log('📤 Sent images to frontend:', imageUrls.length, 'images');
          } else {
            console.log('⚠️ No images to send to frontend');
          }

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
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('Image search error:', message, err);
          const errorData = `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
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
    console.error('Image search route error:', error);
    return NextResponse.json({ error: 'Image search failed' }, { status: 500 });
  }
}
