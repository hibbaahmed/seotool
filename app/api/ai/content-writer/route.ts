import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContentSystemPrompt } from '@/lib/content-generation-prompts';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, enableMultiPhase = true, isTest = false, businessName = 'our company', websiteUrl = '' } = await request.json();
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

            let contentType = response.headers.get('Content-Type') || '';
            
            if (!contentType || contentType === 'application/octet-stream') {
              const urlPath = new URL(imageUrl).pathname.toLowerCase();
              if (urlPath.endsWith('.png')) {
                contentType = 'image/png';
              } else if (urlPath.endsWith('.gif')) {
                contentType = 'image/gif';
              } else if (urlPath.endsWith('.webp')) {
                contentType = 'image/webp';
              } else {
                contentType = 'image/jpeg';
              }
            }
            
            const imageBlob = await response.blob();
            console.log(`📦 Image ${i + 1} blob size:`, imageBlob.size, 'bytes', 'contentType:', contentType);
            
            if (imageBlob.type && imageBlob.type !== contentType && imageBlob.type !== 'application/octet-stream') {
              const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
              if (validImageTypes.includes(imageBlob.type)) {
                contentType = imageBlob.type;
                console.log(`📝 Using blob's actual type: ${contentType}`);
              }
            }
            
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
                contentType: contentType,
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    // Choose between single-phase or multi-phase generation
    if (enableMultiPhase) {
      console.log('🔄 Using MULTI-PHASE generation (4 phases, 28,000 tokens total)');
      console.log('📝 Topic:', extractedTopic);
      console.log('🖼️ Images available:', uploadedImageUrls.length);
      console.log('🎥 Videos available:', youtubeVideos.length);
      console.log('🏢 Business name:', businessName);
      return handleMultiPhaseGeneration(
        userInput,
        extractedTopic,
        uploadedImageUrls,
        youtubeVideos,
        apiKey,
        isTest,
        businessName,
        websiteUrl
      );
    } else {
      console.log('⚠️ Using SINGLE-PHASE generation (16,000 tokens)');
      return handleSinglePhaseGeneration(
        userInput,
        extractedTopic,
        uploadedImageUrls,
        youtubeVideos,
        apiKey,
        isTest,
        businessName,
        websiteUrl
      );
    }

  } catch (error) {
    console.error('❌ Content writing error:', error);
    return NextResponse.json({ 
      error: 'Content generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============= MULTI-PHASE GENERATION =============
async function handleMultiPhaseGeneration(
  userInput: string,
  topic: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  apiKey: string,
  isTest: boolean = false,
  businessName: string = 'our company',
  websiteUrl: string = ''
) {
  // Note: Multi-phase is disabled for test mode, but we accept the parameter for consistency
  const encoder = new TextEncoder();
  
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        // Send images and videos first
        if (imageUrls.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'images', urls: imageUrls })}\n\n`));
        }
        if (videos.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'videos', videos })}\n\n`));
        }

        // PHASE 1: Generate Outline
        console.log('📋 Phase 1: Generating outline...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 1, description: 'Generating article outline...' })}\n\n`));
        
        const outline = await generatePhase(
          getOutlinePrompt(topic, userInput, businessName),
          apiKey,
          4000
        );
        
        console.log(`✅ Phase 1 complete. Outline length: ${outline.length} characters`);
        
        // Stream outline to user
        await streamText(outline, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 1 })}\n\n`));

        // PHASE 2: Generate Introduction + First 4 sections
        console.log('✍️ Phase 2: Writing introduction and sections 1-4...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 2, description: 'Writing introduction and sections 1-4...' })}\n\n`));
        
        const sections1to4 = await generatePhase(
          getSectionsPrompt(topic, userInput, outline, '1-4', imageUrls, videos, 'introduction and first 4 sections'),
          apiKey,
          8000
        );
        
        const words1to4 = sections1to4.split(/\s+/).length;
        console.log(`✅ Phase 2 complete. Length: ${sections1to4.length} chars, ~${words1to4} words`);
        
        await streamText(sections1to4, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 2 })}\n\n`));

        // PHASE 3: Generate Sections 5-8
        console.log('✍️ Phase 3: Writing sections 5-8...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 3, description: 'Writing sections 5-8...' })}\n\n`));
        
        const sections5to8 = await generatePhase(
          getSectionsPrompt(topic, userInput, outline, '5-8', imageUrls, videos, 'sections 5-8'),
          apiKey,
          8000
        );
        
        const words5to8 = sections5to8.split(/\s+/).length;
        console.log(`✅ Phase 3 complete. Length: ${sections5to8.length} chars, ~${words5to8} words`);
        
        await streamText(sections5to8, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 3 })}\n\n`));

        // PHASE 4: Generate Remaining sections, FAQ, and Conclusion
        console.log('✍️ Phase 4: Writing final sections, FAQ, and conclusion...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 4, description: 'Writing final sections, FAQ, and conclusion...' })}\n\n`));
        
        const finalSections = await generatePhase(
          getFinalSectionsPrompt(topic, userInput, outline, imageUrls, videos, businessName, websiteUrl),
          apiKey,
          8000
        );
        
        const wordsFinal = finalSections.split(/\s+/).length;
        console.log(`✅ Phase 4 complete. Length: ${finalSections.length} chars, ~${wordsFinal} words`);
        
        // Calculate total word count
        const totalWords = words1to4 + words5to8 + wordsFinal;
        console.log(`🎉 Multi-phase generation complete! Total: ~${totalWords} words`);
        
        await streamText(finalSections, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 4 })}\n\n`));

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
        
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
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
}

// Helper function to generate each phase
async function generatePhase(
  systemPrompt: string,
  apiKey: string,
  maxTokens: number
): Promise<string> {
  const candidateModels = [
    'claude-sonnet-4-5-20250929',
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229',
  ];

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            { role: 'user', content: 'Generate the content as specified in the system prompt.' }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0]?.text || '';
      }
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      continue;
    }
  }

  throw new Error('All Claude models failed for this phase');
}

// Helper function to stream text gradually
async function streamText(
  text: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  const chunkSize = 50; // Characters per chunk
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`));
    // Small delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// ============= PROMPT GENERATORS =============

function getOutlinePrompt(topic: string, userInput: string, businessName: string = 'our company'): string {
  return `You are creating a comprehensive article outline for a 6,000-8,500 word pillar article about: "${topic}"

User requirements: ${userInput}

Generate a detailed outline with:

1. **Title**
SEO-optimized title (55-65 characters with primary keyword "${topic}")
DO NOT write "Title:" as a label in the output - just write the title text itself.

2. **Meta Description**
150-160 characters with primary keyword
DO NOT write "Meta Description:" as a label in the output - just write the description text itself.

3. **Introduction Structure** (target: 400-600 words)
- Hook paragraph
- Why this topic matters
- What readers will learn

4. **Main Content: 10-12 H2 Sections** (target: 6,000-7,000 words total)
For EACH H2 section:
- Create a descriptive H2 title with secondary keywords
- List 4-5 specific H3 subsections
- Note: Each H2 should yield 600-800 words
- Note: Each H3 should yield 150-200 words
- Indicate where to place comparison tables (need 4-6 total across all sections)
- Indicate where to place images/videos

Example H2 structure:
## [H2 Title]
### [H3: Specific subtopic]
### [H3: Related technique]  
### [H3: Advanced strategy]
### [H3: Common mistakes]
### [H3: Best practices]

5. **FAQ Section** (target: 1,200-1,500 words)
- List 12-15 specific questions
- Questions should cover: How, Why, What, When, Where, Who
- Mix basic and advanced questions

6. **Conclusion** (target: 500-600 words)
- Key takeaways (4-5 bullet points with specific article insights)
- Final actionable advice
- "Partner with ${businessName} for Success" subsection that references specific article topics and explains how ${businessName} helps with those exact things

FORMAT: Use markdown with ## for H2 and ### for H3. Be VERY specific with section titles - use actual descriptive titles, not placeholders.

CRITICAL: Create at least 10 H2 sections to reach the 6,000+ word target.`;
}

function getSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  sectionRange: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  description: string
): string {
  return `You are writing the ${description} for a comprehensive pillar article about: "${topic}"

TARGET LENGTH FOR THIS PHASE: 2,000-2,500 words minimum

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES (embed 1-2 per section):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS (embed if relevant):
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write sections ${sectionRange} according to the outline above. Follow this structure EXACTLY:

FOR EACH H2 SECTION (target: 600-800 words per H2):

## [H2 Title from Outline]

Opening paragraph (100-150 words):
- Introduce the concept
- Explain why it matters
- What readers will learn in this section

### [H3 Subsection 1 from Outline]

**Bold opening sentence that summarizes this subsection**

Write 150-200 words covering:
- Step-by-step explanation or detailed breakdown
- Specific example with real numbers (e.g., "increases engagement by 45%")
- Tool names, metrics, data points
- Before/after scenario if applicable

### [H3 Subsection 2 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Build on previous subsection
- More detailed guidance
- Another specific example with data
- Comparison: "Method A vs Method B"

### [H3 Subsection 3 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Advanced technique or alternative approach
- Case study or real-world application
- Pro tip in blockquote: > **Pro Tip:** [advice]

### [H3 Subsection 4 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Common mistakes to avoid
- Best practices
- Troubleshooting advice

### [H3 Subsection 5 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Expert insights or industry trends
- Future outlook or emerging techniques
- Actionable takeaway

[Add comparison table if outline indicates one should go here]

### 5-Point Comparison: [Descriptive Title]

| Approach/Method | Complexity | Time Required | Cost | Best For | Key Benefit |
|-----------------|------------|---------------|------|----------|-------------|
| Option 1 | Low | 1-2 hours | Free | Beginners | Quick setup |
| Option 2 | Medium | 3-5 hours | $50-100 | Professionals | Advanced features |
| Option 3 | High | 1-2 days | $200+ | Enterprises | Full customization |

Transition paragraph (50-75 words) connecting to the next section.

FORMATTING REQUIREMENTS:
- Use **bold** for key terms on first mention
- Use bullet points for lists of 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
- Keep paragraphs 3-4 sentences max
- Use second-person ("you", "your")
- Conversational but authoritative tone

CRITICAL REQUIREMENTS:
- Write ALL sections indicated in the range (${sectionRange})
- Each H2 MUST be 600-800 words minimum
- Each H3 MUST be 150-200 words minimum
- Include specific numbers, metrics, and examples in every subsection
- Do NOT include labels like "Title:", "Meta Description:", "Introduction:", "Section 1:", "Content:", etc.
- Start directly with ## headings from the outline or paragraph text
- Do NOT skip sections - write every H2 and H3 from the outline
- Do NOT include instruction markers like "[Write...]", "[Add...]", "[Insert...]", etc.
- Do NOT include orphaned table headers without data rows - every table must be complete
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments

WORD COUNT TARGET: 2,000-2,500 words for this phase. If you write less, you are failing the requirement.`;
}

function getFinalSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  businessName: string = 'our company',
  websiteUrl: string = ''
): string {
  return `You are writing the final sections of a comprehensive pillar article about: "${topic}"

TARGET LENGTH FOR THIS PHASE: 2,000-2,500 words minimum

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES:
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write the following sections according to the outline:

PART 1: REMAINING H2 SECTIONS (if sections 9-12 exist in outline)

For each remaining H2 section, follow the same structure:
- H2 heading (from outline)
- Opening paragraph (100-150 words)
- 4-5 H3 subsections (150-200 words each)
- Each H3 starts with a **bold summary sentence**
- Include specific examples, data, metrics
- Add comparison tables where indicated
- Use > blockquotes for pro tips

Target: 600-800 words per H2 section

PART 2: FAQ SECTION (target: 1,200-1,500 words)

## FAQ

Write 12-15 comprehensive questions and answers. Format:

**Q: How do [specific action] for [specific outcome]?**

[Opening answer sentence providing direct response]

[Second paragraph with more detail, specific examples, and data]

[Third paragraph with pro tip, best practice, or warning]

Target: 80-100 words per FAQ answer

Example questions to cover:
- How to get started (beginner question)
- What are the costs/requirements (practical question)
- Why choose X over Y (comparison question)
- When is the best time to (timing question)
- Where to find resources (resource question)
- Who should use this (audience question)
- What are common mistakes (troubleshooting question)
- How to measure success (metrics question)
- What's the future outlook (trend question)
- How does it compare to alternatives (competitive question)

PART 3: CONCLUSION (target: 500-600 words)

## Conclusion

Write a comprehensive conclusion with:

Paragraph 1 (100-120 words):
- Recap the main transformation or value proposition
- Emphasize the impact discussed in the article

Paragraph 2 (80-100 words):
- Key takeaways in bullet format:
  - Takeaway 1 with specific metric or insight
  - Takeaway 2 with actionable advice
  - Takeaway 3 with forward-looking perspective
  - Takeaway 4 with practical next step

Paragraph 3 (100-120 words):
- Discuss the future potential or next evolution
- Connect to broader trends

### Partner with ${businessName} for Success

Paragraph 4 (150-200 words):
- Open by referencing 2-3 SPECIFIC challenges, strategies, or topics from THIS article (use actual terms discussed)
- Explain how ${businessName} provides SPECIFIC, CONCRETE solutions to THOSE challenges
- Detail what ${businessName} actually does (specific services/support related to this article)
- Use the same terminology from the article (if it mentions "local SEO," "page speed," "content clusters" - reference those)
- Be specific about support provided (e.g., "we handle X, Y, and Z," "our team specializes in A and B")
- End with a specific, article-relevant call-to-action
- Example structure: "Implementing [article topics X, Y, Z] requires [specific challenge]. That's where ${businessName} comes in. We [specific services A, B, C]. ${websiteUrl ? `Visit ${websiteUrl}` : `Contact ${businessName}`} to [specific outcome]."

CRITICAL: The ${businessName} section MUST:
- Reference ACTUAL strategies, challenges, or topics from this specific article by name
- Explain HOW ${businessName} helps with THOSE SPECIFIC things (not vague "expertise")
- Use concrete language (e.g., "handle keyword research and on-page optimization" not "help you succeed")
- Make the connection clear: article taught X → ${businessName} helps implement X
- Avoid generic words: "success," "results," "growth" without context
- Use specific outcomes: "rank higher," "generate qualified leads," "reduce bounce rates," etc.
- Feel article-specific (SEO article CTA ≠ email marketing article CTA)
- Use the business name "${businessName}" naturally

FORMATTING REQUIREMENTS:
- Use **bold** for emphasis
- Keep paragraphs 3-4 sentences max
- Second-person tone ("you", "your")
- No section labels like "Title:", "Meta Description:", "Introduction:", "Section 1:" - start with ## headings or paragraph text directly
- Include specific data and examples in FAQ answers

CRITICAL REQUIREMENTS:
- Write ALL remaining H2 sections from the outline
- Write 12-15 FAQ questions (not just 5-7)
- Each FAQ answer must be 80-100 words (not just 2-3 sentences)
- Conclusion must be 500-600 words total (including ${businessName} section)
- MANDATORY: Include "### Partner with ${businessName} for Success" subsection in Conclusion with clear CTA
- Do NOT include "SEO Suggestions" or "Image suggestions" sections
- Do NOT end with internal linking suggestions
- Do NOT include instruction markers like "# Remaining H2 Sections", "[Write...]", "[Add...]", etc.
- Do NOT include orphaned table headers without data rows
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments

WORD COUNT TARGET: 2,000-2,500 words for this phase minimum. Count carefully and ensure you meet this target.`;
}

// ============= SINGLE-PHASE GENERATION (Original) =============
async function handleSinglePhaseGeneration(
  userInput: string,
  topic: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  apiKey: string,
  isTest: boolean = false,
  businessName: string = 'our company',
  websiteUrl: string = ''
) {
  const systemPrompt = generateContentSystemPrompt({
    keyword: topic,
    imageUrls,
    youtubeVideos: videos,
    isTest,
    businessName,
    websiteUrl
  });

    const candidateModels = [
    'claude-sonnet-4-5-20250929',
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229',
    ];

    let response: Response | null = null;
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
          max_tokens: 16000,
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
    } catch (error) {
      console.error(`❌ Error trying model ${model}:`, error);
        continue;
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({ 
      error: 'Content generation failed - no available Claude models'
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

        if (imageUrls.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'images', urls: imageUrls })}\n\n`));
          }

        if (videos.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'videos', videos })}\n\n`));
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          let carry = '';
        const safeBoundary = /[\s\n\t\r.,;:!?)]$/;

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
                  carry += parsed.delta.text;
                  carry = sanitize(carry);

                  let cut = carry.length - 1;
                  while (cut >= 0 && !safeBoundary.test(carry[cut])) cut--;

                  if (cut >= 0) {
                    const toEmit = carry.slice(0, cut + 1);
                    emit(toEmit);
                    carry = carry.slice(cut + 1);
                  }
                }
              } catch (e) {
              // Ignore parsing errors
              }
            }
          }

          if (carry) emit(carry);

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
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
}
