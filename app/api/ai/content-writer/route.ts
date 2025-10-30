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
    
    // Simple, direct prompt to avoid word-breaking issues
    const systemPrompt = `You are an expert SEO content writer creating professional blog articles.

AVAILABLE IMAGES (embed these using Markdown throughout the article):
${uploadedImageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Embed images rules:
- Use: ![concise descriptive alt text](IMAGE_URL)
- Place images near relevant headings/paragraphs (e.g., after H2 or the first paragraph of a section)
- Distribute images across the article rather than grouping all at the end
- Do NOT write placeholders; use the actual URLs above

STRICT OUTPUT FORMAT (use EXACTLY this structure):
1. **Title**
[Write a compelling SEO title (~55-60 chars) on ONE line]

2. **Meta Description**
[Write 150-160 characters on ONE line]

3. **Content**
# [Same title as above]

## Introduction
[Short 1-3 sentence paragraph]

[Then continue with H2/H3 sections as needed]

4. **SEO Suggestions**
- [3-5 internal link anchor ideas]
- [Image suggestions if any]

5. **Call-to-Action**
[One sentence CTA]

CRITICAL RULES:
- NEVER split words across lines (e.g., "Generatio\nn" is FORBIDDEN). If a word would wrap, write it fully on the next line.
- Headings (##/###) MUST be complete on ONE line. If too long, rewrite shorter instead of breaking.
- Use proper Markdown only (## for H2, ### for H3, - for bullets, **bold** as needed).
- Keep paragraphs short (1–3 sentences). Use blank lines between blocks.
- Aim for 1,500–2,500 words. Tone: professional yet conversational, 8th–10th grade, active voice.
`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    // Use the latest Claude models with proper fallback
    // Prefer Claude 3 Sonnet as requested
    const candidateModels = [
      'claude-3-sonnet-20240229',   // Claude 3 Sonnet (preferred)
      'claude-3-haiku-20240307',    // Claude 3 Haiku (fallback)
      'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet
      'claude-3-5-haiku-20241022',  // Claude 3.5 Haiku
      'claude-sonnet-4-20250514',   // Sonnet 4 (further fallback)
      'claude-sonnet-4-5-20250929'  // Sonnet 4.5 (latest)
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
          const sanitize = (text: string): string => {
            if (!text) return text;
            return text
              .replace(/([A-Za-z])\n([a-z])/g, '$1$2')
              .replace(/(#{1,6}[^\n]*[A-Za-z])\n([a-z]{1,5})/g, '$1$2');
          };

          const emit = (payload: string) => {
            if (!payload) return;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', value: payload })}\n\n`));
          };

          // Send images event first so the client can display them immediately
          if (uploadedImageUrls.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'images', urls: uploadedImageUrls })}\n\n`));
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          let carry = '';
          const safeBoundary = /[\s\n\t\r.,;:!?)]$/; // characters that safely end a token chunk

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  // Append to carry and sanitize
                  carry += parsed.delta.text;
                  carry = sanitize(carry);

                  // Find the last safe boundary to emit up to
                  let cut = carry.length - 1;
                  while (cut >= 0 && !safeBoundary.test(carry[cut])) cut--;

                  // Only emit if we found a boundary and it’s not trivial
                  if (cut >= 0) {
                    const toEmit = carry.slice(0, cut + 1);
                    emit(toEmit);
                    carry = carry.slice(cut + 1);
                  }
                }
              } catch (e) {
                // Ignore parsing errors (incomplete JSON)
              }
            }
          }

          // Flush any remaining buffered content
          if (carry) emit(carry);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
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