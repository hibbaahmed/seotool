import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();
    const userInput = messages[messages.length - 1]?.content || '';
    
    // Extract topic/keywords for image search
    const topicMatch = userInput.match(/Topic: "([^"]+)"/);
    const topic = topicMatch ? topicMatch[1] : userInput.split('\n')[0] || 'content creation';
    
    // Search for relevant YouTube videos
    let youtubeVideos: Array<{ id: string; title: string; url: string }> = [];
    
    if (process.env.YOUTUBE_API_KEY) {
      try {
        console.log('🎥 Searching for YouTube videos for topic:', topic);
        const youtubeResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(topic)}&maxResults=3&key=${process.env.YOUTUBE_API_KEY}&videoEmbeddable=true`
        );
        
        if (youtubeResponse.ok) {
          const youtubeData = await youtubeResponse.json();
          if (youtubeData.items && youtubeData.items.length > 0) {
            youtubeVideos = youtubeData.items.map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
            console.log('🎥 Found YouTube videos:', youtubeVideos.length);
          }
        }
      } catch (error) {
        console.error('❌ YouTube search error:', error);
      }
    }
    
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

            // Get content type from headers or infer from URL/blob
            let contentType = response.headers.get('Content-Type') || '';
            
            // If no content type, try to infer from URL extension
            if (!contentType || contentType === 'application/octet-stream') {
              const urlPath = new URL(imageUrl).pathname.toLowerCase();
              if (urlPath.endsWith('.png')) {
                contentType = 'image/png';
              } else if (urlPath.endsWith('.gif')) {
                contentType = 'image/gif';
              } else if (urlPath.endsWith('.webp')) {
                contentType = 'image/webp';
              } else {
                contentType = 'image/jpeg'; // Default fallback
              }
            }
            
            const imageBlob = await response.blob();
            console.log(`📦 Image ${i + 1} blob size:`, imageBlob.size, 'bytes', 'contentType:', contentType);
            
            // Validate blob type matches expected content type
            if (imageBlob.type && imageBlob.type !== contentType && imageBlob.type !== 'application/octet-stream') {
              // Use blob's actual type if it's a valid image type
              const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
              if (validImageTypes.includes(imageBlob.type)) {
                contentType = imageBlob.type;
                console.log(`📝 Using blob's actual type: ${contentType}`);
              }
            }
            
            // Ensure contentType is valid (not application/octet-stream)
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!validImageTypes.includes(contentType)) {
              console.warn(`⚠️ Invalid content type ${contentType}, defaulting to image/jpeg`);
              contentType = 'image/jpeg';
            }
            
            const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}`;
            const typeToExt: Record<string, string> = { 
              'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 
              'image/webp': 'webp', 'image/gif': 'gif' 
            };
            const fileExtension = typeToExt[contentType.toLowerCase()] || 'jpg';
            const filePath = `user_uploads/${uploadUserId}/${id}.${fileExtension}`;
            
            console.log(`📁 Uploading to path:`, filePath, 'with contentType:', contentType);
            
            const uploadResult = await supabase.storage
              .from('photos')
              .upload(filePath, imageBlob, {
                cacheControl: '3600',
                upsert: true,
                contentType: contentType, // Explicitly set valid content type
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
    
    // Extract topic/keyword for better optimization
    const extractedTopic = topic || (userInput.match(/Topic:\s*"?([^"\n]+)"?/i)?.[1] || '').trim();
    
    // Enhanced system prompt for Outrank-style content
    const systemPrompt = `You are an expert SEO content writer who creates comprehensive, engaging articles that rank well in search engines.

${extractedTopic ? `PRIMARY KEYWORD/TOPIC: "${extractedTopic}" - You MUST optimize the title and content for this specific keyword.` : ''}

AVAILABLE IMAGES (embed using Markdown):
${uploadedImageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

IMAGE AND VIDEO PLACEMENT RULES:
- DO NOT place images and videos directly next to each other
- Always include at least 2-3 paragraphs of text between any image and video
- Distribute images and videos throughout the article, not clustered together
- Place images after relevant H2 sections or within H3 subsections
- Place videos after relevant H2 sections or key paragraphs where they add value
- Ensure substantial content (100+ words) between media elements

${youtubeVideos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${youtubeVideos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Your articles follow this proven structure:

1. **Engaging Title**: Include the main keyword naturally, make it benefit-driven
2. **Hook Introduction**: Start with a pain point or surprising fact
3. **Hierarchical Content**: H2 sections with 2-3 H3 subsections each
4. **Data-Driven Examples**: Include specific numbers, tool names, real scenarios
5. **Visual Content**: Embed images after H2 sections, videos where relevant
6. **Pro Tips**: Use blockquotes (>) for insider advice
7. **FAQ Section**: Answer 5-7 common questions directly
8. **Actionable Conclusion**: Clear next steps

Writing style:
- Conversational and authoritative
- Second person ("you", "your")
- Short paragraphs (3-4 sentences)
- Active voice
- Include contractions
- Address reader pain points directly

CRITICAL STRUCTURE REQUIREMENTS:
- 5-7 H2 sections (major topics)
- Each H2 MUST contain 2-3 H3 subsections (specific techniques/tools/strategies)
- Include at least 7 specific examples with real numbers
- Add 2-3 professional comparison tables (REQUIRED)
- Create FAQ section with 5-7 questions
- Use > blockquotes for pro tips
- Word count: 2,500-3,500 words

COMPARISON TABLES FORMAT (MANDATORY - Add 2-3 tables):
- Create titled comparison tables with descriptive headings
- Format: Use H3 heading with title like "10-Point Comparison: [Topic]" or "[Number]-Point Comparison: [Topic]"
- Include 5-10 comparison rows with 4-6 columns
- Common column headers: Feature/Approach/Method, Complexity, Resources Needed, Outcomes/Results, Use Cases, Advantages/Benefits, Time Required, Cost
- Use proper markdown table format:
  
  ### [Number]-Point Comparison: [Topic Description]
  
  | [Row Header Column] | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
  | --- | --- | --- | --- | --- | --- |
  | Option/Method 1 | Value/details | Value/details | Value/details | Value/details | Value/details |
  | Option/Method 2 | Value/details | Value/details | Value/details | Value/details | Value/details |
  | Option/Method 3 | Value/details | Value/details | Value/details | Value/details | Value/details |
  
- Place tables strategically after relevant H2 sections or within H3 subsections
- Include real metrics, comparisons, and actionable data
- Make tables useful for reader decision-making

FORMATTING:
- Use **bold** for key terms on first mention
- Use bullet points for lists with 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

STRICT OUTPUT FORMAT:
1. **Title**
[SEO-optimized title with primary keyword, 55-65 characters]

2. **Meta Description**
[150-160 characters with primary keyword]

3. **Content**
# [Same title]

[Hook paragraph addressing pain point - 2-3 sentences]

[Why this matters - 2-3 sentences]

[What they'll learn - 2-3 sentences]

## H2: [Secondary Keyword Variation]

[Opening paragraph explaining the concept - 3-4 sentences]

### H3: Specific Technique or Tool

[Detailed explanation with example and real numbers - include metrics like "5,000/month" or "3x increase"]

### H3: Related Approach

[Build on previous subsection - include pro tip or best practice]

> **Pro Tip:** [Insider advice in blockquote]

### H3: Advanced Strategy

[Further depth with before/after comparison or data table]

[Transition paragraph to next section]

## H2: [Next Major Topic]

[Continue pattern with 2-3 H3 subsections each]

## FAQ

**Q: [Natural language question]**
[Direct answer in 2-3 sentences, then expand with context]

**Q: [Another question]**
[Answer with specific details and keywords]

[Continue with 5-7 total questions]

[Closing paragraph with 3-4 key takeaways in bullets]

[Final call-to-action paragraph - encouraging and actionable]

4. **SEO Suggestions**
- [3-5 internal link anchor ideas]
- [Image suggestions if any]

CRITICAL RULES:
- NEVER split words across lines (e.g., "Generatio\nn" is FORBIDDEN). If a word would wrap, write it fully on the next line.
- Headings (##/###) MUST be complete on ONE line. If too long, rewrite shorter instead of breaking.
- Use proper Markdown only (## for H2, ### for H3, - for bullets, **bold** as needed).
- DO NOT use section labels like "Introduction:", "Call-to-Action:", or "Understanding [Topic]:" before paragraphs. Start paragraphs immediately after the main title and after subheadings.
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

          // Send YouTube videos event so the client can display them
          if (youtubeVideos.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'videos', videos: youtubeVideos })}\n\n`));
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