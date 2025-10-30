import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();
    const userInput = messages[messages.length - 1]?.content || '';
    
    // Extract topic/keywords for image search
    const topicMatch = userInput.match(/Topic: "([^"]+)"/);
    const topic = topicMatch ? topicMatch[1] : userInput.split('\n')[0] || 'content creation';
    
    // Search for relevant images first
    let imageUrls: string[] = [];
    let imageAnalysis = '';
    
    if (process.env.TAVILY_API_KEY) {
      try {
        console.log('🔍 Searching for images for topic:', topic);
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: topic,
            search_depth: 'basic',
            include_images: true,
            max_results: 5
          })
        });

        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          if (tavilyData.images && tavilyData.images.length > 0) {
            imageUrls = tavilyData.images.filter(Boolean);
            console.log('🖼️ Found images for content:', imageUrls.length);
          }
        }
      } catch (error) {
        console.error('❌ Image search error:', error);
      }
    }
    
    // Use demo images if no images found
    if (imageUrls.length === 0) {
      imageUrls = [
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800'
      ];
    }

    // Upload images to Supabase Storage
    let uploadedImageUrls: string[] = [];
    if (imageUrls.length > 0) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('📤 Starting image upload process for', imageUrls.length, 'images');
        
        // Use the userId from the request, or fallback to 'content-writer' if not provided
        const uploadUserId = userId || 'content-writer';
        
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          try {
            console.log(`🔄 Starting upload for image ${i + 1}:`, imageUrl);
            
            // Fetch image
            const response = await fetch(imageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Referer': new URL(imageUrl).origin,
              },
              cache: 'no-store',
            });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('Content-Type') || 'image/jpeg';
            const imageBlob = await response.blob();
            console.log(`📦 Image ${i + 1} blob size:`, imageBlob.size, 'bytes', 'contentType:', contentType);
            
            // Generate unique ID and infer extension from content-type
            const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}`;
            const typeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
            const fileExtension = typeToExt[contentType.toLowerCase()] || 'jpg';
            const filePath = `user_uploads/${uploadUserId}/${id}.${fileExtension}`;
            
            console.log(`📁 Uploading to path:`, filePath);
            
            // Upload to Supabase Storage
            const uploadResult = await supabase.storage
              .from('photos')
              .upload(filePath, imageBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType,
              });

            console.log(`📤 Upload result for image ${i + 1}:`, uploadResult);
            
            if (uploadResult.error) {
              console.error(`❌ Upload error for image ${i + 1}:`, uploadResult.error);
              continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
              .from('photos')
              .getPublicUrl(filePath);
            
            if (publicUrlData?.publicUrl) {
              uploadedImageUrls.push(publicUrlData.publicUrl);
              console.log(`✅ Image ${i + 1} uploaded successfully:`, publicUrlData.publicUrl);
            }
          } catch (error) {
            console.error(`❌ Error uploading image ${i + 1}:`, error);
            continue;
          }
        }
        
        console.log('📤 Upload process completed. Successfully uploaded:', uploadedImageUrls.length, 'images');
      } catch (error) {
        console.error('❌ Error in upload process:', error);
      }
    }
    
    // Enhanced prompt for content writing with image integration
    const systemPrompt = `You are an expert content writer and SEO specialist. Create high-quality, engaging content based on the following request.

I have found ${uploadedImageUrls.length} relevant images for this topic that you should embed in the content using Markdown image syntax. Here are the image URLs (use them in order unless a different image is clearly more relevant to the section):
${uploadedImageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Your content should:
- Be well-structured with clear headings and subheadings
  - Use Markdown for headings (## for H2, ### for H3) and bold where appropriate
  - Do not include literal labels like "H2:" or "H3:" anywhere in the text
- Include relevant keywords naturally
- Be engaging and valuable to readers
- Include internal linking suggestions
- Be optimized for SEO
- Include a compelling introduction and conclusion
- Use bullet points and numbered lists where appropriate
- Be between 1000-2000 words for blog posts
- Embed actual images throughout the content using Markdown. Use the format: ![short descriptive alt text](IMAGE_URL)
- Distribute images across sections where they add value. Prefer placing an image immediately after the heading or after the first descriptive paragraph of a section.
- Do NOT output placeholders like [IMAGE_PLACEMENT: ...]; always place real images using the provided URLs.

Format your response with:
1. **Title** - SEO-optimized headline
2. **Meta Description** - 150-160 characters
3. **Content** - Full article in Markdown with proper headings and embedded images using the supplied URLs
4. **Image Suggestions** - Specific recommendations for where to place images
5. **SEO Suggestions** - Internal links, additional images, etc.
6. **Call-to-Action** - Engaging conclusion with CTA

Spacing and formatting requirements:
- Put a blank line before and after every heading and image
- Use bullet/numbered lists with standard Markdown spacing

Make the content informative, engaging, and optimized for search engines.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    // Try Anthropic with graceful model fallback (404 typically means model not found for the account)
    const candidateModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-20241022'
    ];

    let response: Response | null = null;
    let lastErrorBody: string | null = null;

    for (const model of candidateModels) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userInput }
          ],
          stream: true
        })
      });

      if (r.ok) { response = r; break; }
      try { lastErrorBody = await r.text(); } catch { lastErrorBody = null; }
      console.error(`Anthropic model ${model} failed (${r.status}). Body:`, lastErrorBody);
      // 404 is common for unavailable models – try next
    }

    if (!response || !response.ok) {
      const detail = lastErrorBody ? ` - ${lastErrorBody}` : '';
      throw new Error(`API error: ${response ? response.status : 'no_response'}${detail}`);
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send images first if we found any
          if (uploadedImageUrls.length > 0) {
            const imagesData = `data: ${JSON.stringify({ type: 'images', urls: uploadedImageUrls })}\n\n`;
            controller.enqueue(encoder.encode(imagesData));
            console.log('📤 Sent uploaded images to content writer:', uploadedImageUrls.length, 'images');
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
          console.error('Content writer error:', message, err);
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
    console.error('Content writing error:', error);
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}
