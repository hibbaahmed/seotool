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
        
        const uploadUserId = userId || 'content-writer';
        
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i];
          try {
            console.log(`🔄 Starting upload for image ${i + 1}:`, imageUrl);
            
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
            
            const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}`;
            const typeToExt: Record<string, string> = { 
              'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 
              'image/webp': 'webp', 'image/gif': 'gif' 
            };
            const fileExtension = typeToExt[contentType.toLowerCase()] || 'jpg';
            const filePath = `user_uploads/${uploadUserId}/${id}.${fileExtension}`;
            
            console.log(`📁 Uploading to path:`, filePath);
            
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
    
    // Professional blog writing prompt
    const systemPrompt = `You are an expert SEO content writer creating professional, publication-ready blog posts.

AVAILABLE IMAGES (${uploadedImageUrls.length} total):
${uploadedImageUrls.map((u, i) => `Image ${i + 1}: ${u}`).join('\n')}

CRITICAL: Write complete words only. Never end a line mid-word. Always complete the full word before moving to the next line.

FORMATTING REQUIREMENTS:
1. Use proper Markdown: ## for H2, ### for H3 (never write "H2:" or "H3:")
2. Embed images using: ![descriptive alt text](full-image-url)
3. Add blank lines before and after headings, images, and lists
4. Keep paragraphs 2-4 sentences max
5. Write complete words - never break words with hyphens or across lines

STRUCTURE:

# [SEO-Optimized Title 50-60 characters]

**Meta Description:** [150-160 character summary with primary keyword]

## Introduction

[Hook with problem/question/statistic in 2-3 sentences]

![Descriptive alt text](${uploadedImageUrls[0] || 'IMAGE_URL_1'})

[2-3 paragraphs establishing context, value, and preview. Total ~200 words.]

## [Major Section Title]

[Introduction paragraph for this section]

### [Subsection Title]

[2-3 paragraphs with specific examples and actionable insights]

**Key takeaways:**
- First important point with details
- Second important point with details  
- Third important point with details

![Section-specific descriptive alt](${uploadedImageUrls[1] || 'IMAGE_URL_2'})

### [Another Subsection]

[More detailed content with examples]

## [Next Major Section]

[Repeat pattern: intro, subsections, bullets, images]

![Relevant visual](${uploadedImageUrls[2] || 'IMAGE_URL_3'})

[Create 5-7 major H2 sections total]

## Conclusion

[2-3 paragraphs summarizing key takeaways and reinforcing main benefit]

![Inspiring closing image](${uploadedImageUrls[4] || 'IMAGE_URL_5'})

**Ready to [specific action]?**

[2-sentence compelling call-to-action]

---

**SEO Notes:**
- **Primary Keyword:** [main keyword]
- **Secondary Keywords:** [keyword 1], [keyword 2], [keyword 3]
- **Internal Links:** "[anchor 1]", "[anchor 2]", "[anchor 3]"
- **Schema:** Article, HowTo
- **Update:** Quarterly review

WRITING STYLE:
- Professional yet conversational
- Active voice 80%+
- Mix short and detailed sentences
- Specific examples over generic statements
- Direct address: "you" and "your"
- Frequent visual breaks

TARGET: 1,800-2,500 words

Remember: Complete all words fully. Never split words. Write naturally and professionally.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    // Use the latest Claude models with proper fallback
    // Model names updated as of October 2025
    const candidateModels = [
      'claude-sonnet-4-5-20250929',  // Latest Sonnet 4.5 (Sep 2025) - best for complex content
      'claude-haiku-4-5-20251001',   // Latest Haiku 4.5 (Oct 2025) - fast and efficient
      'claude-sonnet-4-20250514',    // Sonnet 4 (May 2025) - fallback
      'claude-3-5-sonnet-20241022',  // Claude 3.5 Sonnet - wider availability
      'claude-3-5-haiku-20241022'    // Claude 3.5 Haiku - final fallback
    ];

    let response: Response | null = null;
    let lastErrorBody: string | null = null;
    let usedModel: string | null = null;

    for (const model of candidateModels) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userInput }
            ],
            stream: true
          })
        });

        if (r.ok) { 
          response = r;
          usedModel = model;
          console.log(`✅ Successfully using Claude model: ${model}`);
          break; 
        }
        
        try { 
          lastErrorBody = await r.text(); 
        } catch { 
          lastErrorBody = null; 
        }
        
        console.warn(`⚠️ Model ${model} unavailable (${r.status}), trying next...`);
      } catch (fetchError) {
        console.error(`❌ Error trying model ${model}:`, fetchError);
        continue;
      }
    }

    if (!response || !response.ok) {
      const detail = lastErrorBody ? ` - ${lastErrorBody}` : '';
      const errorMsg = `All Claude models failed. Last error: ${response ? response.status : 'no_response'}${detail}`;
      console.error('❌', errorMsg);
      return NextResponse.json({ 
        error: 'Content generation failed - no available Claude models',
        details: lastErrorBody 
      }, { status: 503 });
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send model info
          if (usedModel) {
            const modelData = `data: ${JSON.stringify({ type: 'model', name: usedModel })}\n\n`;
            controller.enqueue(encoder.encode(modelData));
          }

          // Send images first if we found any
          if (uploadedImageUrls.length > 0) {
            const imagesData = `data: ${JSON.stringify({ type: 'images', urls: uploadedImageUrls })}\n\n`;
            controller.enqueue(encoder.encode(imagesData));
            console.log('📤 Sent uploaded images to content writer:', uploadedImageUrls.length, 'images');
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          // Buffer to accumulate incomplete chunks and prevent word breaks
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Send any remaining buffered content
              if (buffer) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', value: buffer })}\n\n`));
              }
              break;
            }

            const chunk = new TextDecoder().decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines only to prevent breaking mid-JSON
            const lines = buffer.split('\n');
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    const text = parsed.delta.text;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', value: text })}\n\n`));
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete JSON
                  // This is normal during streaming
                }
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('❌ Content writer streaming error:', message);
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
    console.error('❌ Content writing error:', error);
    return NextResponse.json({ 
      error: 'Content generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}