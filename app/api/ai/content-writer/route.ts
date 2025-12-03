import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContentSystemPrompt } from '@/lib/content-generation-prompts';
import { createClient as createServerClient } from '@/utils/supabase/server';
import type { CandidateImage } from '@/lib/ai-image-generation';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check credits before proceeding
    const requiredCredits = 1;
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      return NextResponse.json(
        { error: 'Could not fetch user credits' },
        { status: 500 }
      );
    }

    const currentCredits = creditsData.credits || 0;

    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${requiredCredits} credit(s) to generate content. You currently have ${currentCredits} credit(s).` },
        { status: 402 } // 402 Payment Required
      );
    }

    // Fetch user settings for content length preference
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('content_length')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const contentLength = (settingsData?.content_length || 'long') as 'short' | 'medium' | 'long';

    // Helper function to calculate max_tokens based on content length
    // Approximately 1 token = 0.75 words, so we add buffer for safety
    const getMaxTokens = (length: 'short' | 'medium' | 'long'): number => {
      switch (length) {
        case 'short':
          return 2500; // ~1500 words max with buffer
        case 'medium':
          return 4500; // ~3000 words max with buffer
        case 'long':
          return 6000; // ~4200 words max with buffer
        default:
          return 6000;
      }
    };

    const { messages, userId, enableMultiPhase = true, isTest = false, businessName = 'our company', websiteUrl = '', businessDescription = '' } = await request.json();
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
    
    // Generate AI images first
    let candidateImages: CandidateImage[] = [];
    
    try {
      console.log('🎨 Generating AI images for topic:', topic);
      const { generateArticleImages } = await import('@/lib/ai-image-generation');
      candidateImages = await generateArticleImages(topic, 3);
      
      if (candidateImages.length > 0) {
        console.log('🖼️ Generated AI images for content:', candidateImages.length);
      } else {
        console.log('⚠️ No AI images generated, using fallback images');
      }
    } catch (error) {
      console.error('❌ AI image generation error:', error);
    }
    
    // Use demo images if no images found
    if (candidateImages.length === 0) {
      candidateImages = [
        { url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' },
        { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800' },
        { url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800' },
        { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800' },
        { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800' }
      ];
    }

    // Upload images to Supabase Storage
    let uploadedImageUrls: string[] = [];
    if (candidateImages.length > 0) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('📤 Starting image upload process for', candidateImages.length, 'images');
        
        const uploadUserId = userId || 'content-writer';
        
        for (let i = 0; i < candidateImages.length; i++) {
          const candidate = candidateImages[i];
          try {
            let buffer: Buffer | null = null;
            let contentType = candidate.contentType || '';
            let sourceLabel = 'generated candidate';

            if (candidate.url) {
              const imageUrl = candidate.url;
              sourceLabel = imageUrl;
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

              let inferredType = response.headers.get('Content-Type') || '';
              if (!inferredType || inferredType === 'application/octet-stream') {
                const urlPath = new URL(imageUrl).pathname.toLowerCase();
                if (urlPath.endsWith('.png')) {
                  inferredType = 'image/png';
                } else if (urlPath.endsWith('.gif')) {
                  inferredType = 'image/gif';
                } else if (urlPath.endsWith('.webp')) {
                  inferredType = 'image/webp';
                } else {
                  inferredType = 'image/jpeg';
                }
              }

              contentType = contentType || inferredType;
              const arrayBuffer = await response.arrayBuffer();
              buffer = Buffer.from(arrayBuffer);
            } else if (candidate.data) {
              buffer = candidate.data;
              contentType = contentType || 'image/webp';
              console.log(`🔄 Starting upload for generated buffer image ${i + 1}`);
            } else {
              console.warn(`⚠️ Candidate ${i + 1} missing data and URL`);
              continue;
            }

            if (!buffer) continue;
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (!contentType || !validImageTypes.includes(contentType.toLowerCase())) {
              console.warn(`⚠️ Invalid content type ${contentType}, defaulting to image/jpeg`);
              contentType = 'image/jpeg';
            }

            const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}`;
            const typeToExt: Record<string, string> = {
              'image/jpeg': 'jpg',
              'image/jpg': 'jpg',
              'image/png': 'png',
              'image/webp': 'webp',
              'image/gif': 'gif',
            };
            const fileExtension = typeToExt[contentType.toLowerCase()] || 'jpg';
            const filePath = `user_uploads/${uploadUserId}/${id}.${fileExtension}`;

            console.log(`📁 Uploading to path:`, filePath, 'source:', sourceLabel, 'contentType:', contentType);

            const uploadResult = await supabase.storage
              .from('photos')
              .upload(filePath, buffer, {
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
        if (uploadedImageUrls.length > 0) {
          console.log('🪄 Supabase image URLs used in content-writer response:', uploadedImageUrls);
        } else {
          console.log('⚠️ No Supabase image URLs were uploaded; demo URLs will be used in the response.');
        }
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
      const maxTokens = getMaxTokens(contentLength);
      console.log('🔄 Using MULTI-PHASE generation (4 phases)');
      console.log('📝 Topic:', extractedTopic);
      console.log('🖼️ Images available:', uploadedImageUrls.length);
      console.log('🎥 Videos available:', youtubeVideos.length);
      console.log('🏢 Business name:', businessName);
      console.log('📏 Content length:', contentLength, `(max_tokens: ${maxTokens})`);
      return handleMultiPhaseGeneration(
        userInput,
        extractedTopic,
        uploadedImageUrls,
        youtubeVideos,
        apiKey,
        isTest,
        businessName,
        websiteUrl,
        businessDescription,
        user.id,
        currentCredits,
        requiredCredits,
        contentLength,
        maxTokens
      );
    } else {
      const maxTokens = getMaxTokens(contentLength);
      console.log('⚠️ Using SINGLE-PHASE generation');
      console.log('📏 Content length:', contentLength, `(max_tokens: ${maxTokens})`);
      return handleSinglePhaseGeneration(
        userInput,
        extractedTopic,
        uploadedImageUrls,
        youtubeVideos,
        apiKey,
        isTest,
        businessName,
        websiteUrl,
        businessDescription,
        user.id,
        currentCredits,
        requiredCredits,
        contentLength,
        maxTokens
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
  websiteUrl: string = '',
  businessDescription: string = '',
  userId: string,
  currentCredits: number,
  requiredCredits: number,
  contentLength: 'short' | 'medium' | 'long' = 'long',
  maxTokens: number = 6000
) {
  // Calculate phase-specific token limits based on content length
  // For short content, we need much smaller limits per phase
  const getPhaseTokens = (phase: number): number => {
    if (contentLength === 'short') {
      // Short: 1000-1500 words total, distribute across phases
      switch (phase) {
        case 1: return 1000; // Outline
        case 2: return 600;  // Intro + sections 1-2
        case 3: return 500;  // Sections 3-4
        case 4: return 400;  // FAQ + conclusion
        default: return 500;
      }
    } else if (contentLength === 'medium') {
      // Medium: 2000-3000 words total
      switch (phase) {
        case 1: return 1500; // Outline
        case 2: return 1200; // Intro + sections 1-4
        case 3: return 1000; // Sections 5-8
        case 4: return 800;  // FAQ + conclusion
        default: return 1000;
      }
    } else {
      // Long: 3800-4200 words total (original behavior)
      switch (phase) {
        case 1: return 4000; // Outline
        case 2: return 8000; // Intro + sections 1-4
        case 3: return 8000; // Sections 5-8
        case 4: return 8000; // FAQ + conclusion
        default: return 8000;
      }
    }
  };
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
          getOutlinePrompt(topic, userInput, businessName, contentLength),
          apiKey,
          getPhaseTokens(1)
        );
        
        console.log(`✅ Phase 1 complete. Outline length: ${outline.length} characters`);
        
        // Stream outline to user
        await streamText(outline, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 1 })}\n\n`));

        // PHASE 2: Generate Introduction + First 4 sections
        console.log('✍️ Phase 2: Writing introduction and sections 1-4...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 2, description: 'Writing introduction and sections 1-4...' })}\n\n`));
        
        const sections1to4 = await generatePhase(
          getSectionsPrompt(topic, userInput, outline, '1-4', imageUrls, videos, 'introduction and first 4 sections', contentLength, websiteUrl),
          apiKey,
          getPhaseTokens(2)
        );
        
        const words1to4 = sections1to4.split(/\s+/).length;
        console.log(`✅ Phase 2 complete. Length: ${sections1to4.length} chars, ~${words1to4} words`);
        
        await streamText(sections1to4, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 2 })}\n\n`));

        // PHASE 3: Generate Sections 5-8
        console.log('✍️ Phase 3: Writing sections 5-8...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 3, description: 'Writing sections 5-8...' })}\n\n`));
        
        const sections5to8 = await generatePhase(
          getSectionsPrompt(topic, userInput, outline, '5-8', imageUrls, videos, 'sections 5-8', contentLength, websiteUrl),
          apiKey,
          getPhaseTokens(3)
        );
        
        const words5to8 = sections5to8.split(/\s+/).length;
        console.log(`✅ Phase 3 complete. Length: ${sections5to8.length} chars, ~${words5to8} words`);
        
        await streamText(sections5to8, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 3 })}\n\n`));

        // PHASE 4: Generate Remaining sections, FAQ, and Conclusion
        console.log('✍️ Phase 4: Writing final sections, FAQ, and conclusion...');
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase', phase: 4, description: 'Writing final sections, FAQ, and conclusion...' })}\n\n`));
        
        const finalSections = await generatePhase(
          getFinalSectionsPrompt(topic, userInput, outline, imageUrls, videos, businessName, websiteUrl, businessDescription, contentLength),
          apiKey,
          getPhaseTokens(4)
        );
        
        const wordsFinal = finalSections.split(/\s+/).length;
        console.log(`✅ Phase 4 complete. Length: ${finalSections.length} chars, ~${wordsFinal} words`);
        
        // Calculate total word count
        const totalWords = words1to4 + words5to8 + wordsFinal;
        console.log(`🎉 Multi-phase generation complete! Total: ~${totalWords} words`);
        
        await streamText(finalSections, controller, encoder);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'phase_complete', phase: 4 })}\n\n`));

        // Deduct credits after successful generation
        try {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js');
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const { error: deductError } = await serviceSupabase
            .from('credits')
            .update({ credits: currentCredits - requiredCredits })
            .eq('user_id', userId);

          if (deductError) {
            console.error('⚠️ CRITICAL: Content generated successfully but failed to deduct credits:', deductError);
          } else {
            console.log(`✅ Deducted ${requiredCredits} credit(s) from user ${userId} for content generation. Remaining: ${currentCredits - requiredCredits}`);
          }
        } catch (creditError) {
          console.error('⚠️ Error deducting credits:', creditError);
        }

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

function getOutlinePrompt(topic: string, userInput: string, businessName: string = 'our company', contentLength: 'short' | 'medium' | 'long' = 'long'): string {
  const wordTargets = {
    short: { total: '1,000-1,500', h2s: '4-5', h2Words: '150-250', intro: '100-150', faq: '5-7', conclusion: '100-150' },
    medium: { total: '2,000-3,000', h2s: '5-6', h2Words: '250-350', intro: '150-200', faq: '6-8', conclusion: '150-200' },
    long: { total: '3,800-4,200', h2s: '6-8', h2Words: '400-500', intro: '200-250', faq: '8-10', conclusion: '200-250' }
  };
  const targets = wordTargets[contentLength];
  
  return `You are creating a comprehensive article outline for a ${targets.total} word article about: "${topic}"

CRITICAL: The final article MUST be between ${targets.total} words. Do NOT exceed ${targets.total.split('-')[1]} words.

User requirements: ${userInput}

Generate a detailed outline with:

1. **Title**
SEO-optimized title (55-65 characters with primary keyword "${topic}")
DO NOT write "Title:" as a label in the output - just write the title text itself.

2. **Meta Description**
150-160 characters with primary keyword
DO NOT write "Meta Description:" as a label in the output - just write the description text itself.

3. **Introduction Structure** (target: ${targets.intro} words)
- Hook paragraph
- Why this topic matters
- What readers will learn

4. **Main Content: ${targets.h2s} H2 Sections** (target: ${contentLength === 'short' ? '800-1,000' : contentLength === 'medium' ? '1,500-2,000' : '3,000-3,500'} words total)
For EACH H2 section:
- Create a descriptive H2 title with secondary keywords
- List 2-3 specific H3 subsections${contentLength === 'long' ? ' (4-5 for long articles)' : ''}
- Note: Each H2 should yield ${targets.h2Words} words
- Note: Each H3 should yield ${contentLength === 'short' ? '50-80' : contentLength === 'medium' ? '80-120' : '100-200'} words
- Indicate where to place HTML comparison tables (need ${contentLength === 'short' ? '0-1' : contentLength === 'medium' ? '1-2' : '3-4'} total across all sections)
- Indicate where to place images/videos
- IMPORTANT: Tables must be in HTML format, not Markdown

Example H2 structure:
## [H2 Title]
### [H3: Specific subtopic]
### [H3: Related technique]  
${contentLength === 'long' ? '### [H3: Advanced strategy]\n### [H3: Common mistakes]\n### [H3: Best practices]' : ''}

5. **FAQ Section** (target: ${contentLength === 'short' ? '200-300' : contentLength === 'medium' ? '400-600' : '800-1,000'} words)
- List ${targets.faq} specific questions
- Questions should cover: How, Why, What, When, Where, Who
- Mix basic and advanced questions

6. **Conclusion** (target: ${targets.conclusion} words)
- Key takeaways (${contentLength === 'short' ? '3-4' : '4-5'} bullet points with specific article insights)
- Final actionable advice
- "Partner with ${businessName} for Success" subsection that references specific article topics and explains how ${businessName} helps with those exact things

FORMAT: Use markdown with ## for H2 and ### for H3. Be VERY specific with section titles - use actual descriptive titles, not placeholders.

CRITICAL: The final article MUST be exactly ${targets.total} words. Do NOT exceed the maximum.`;
}

function getSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  sectionRange: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  description: string,
  contentLength: 'short' | 'medium' | 'long' = 'long',
  websiteUrl: string = ''
): string {
  const phaseTargets = {
    short: { phase2: '300-400', phase3: '250-350', phase4: '200-300', h2: '150-250', h3: '50-80' },
    medium: { phase2: '600-800', phase3: '500-700', phase4: '400-600', h2: '250-350', h3: '80-120' },
    long: { phase2: '1,500-1,800', phase3: '1,500-1,800', phase4: '1,500-1,800', h2: '400-550', h3: '100-130' }
  };
  const targets = phaseTargets[contentLength];
  const phaseTarget = sectionRange === '1-4' ? targets.phase2 : sectionRange === '5-8' ? targets.phase3 : targets.phase4;
  
  return `You are writing the ${description} for a ${contentLength === 'short' ? '1,000-1,500 word' : contentLength === 'medium' ? '2,000-3,000 word' : '3,800-4,200 word'} article about: "${topic}"

CRITICAL: TARGET LENGTH FOR THIS PHASE: ${phaseTarget} words MAXIMUM. Do NOT exceed this limit.

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES:
${imageUrls.map((u, i) => `${i + 1}. ${u}${i === 0 ? ' (FEATURED IMAGE - do not embed in content)' : ' (embed using Markdown)'}`).join('\n')}
- IMPORTANT: Image #1 is reserved as the featured/header image - DO NOT embed it in the article content
- YOU MUST USE images #2 onwards - embed 1-2 per section

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS (embed if relevant):
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write sections ${sectionRange} according to the outline above. Follow this structure EXACTLY:

FOR EACH H2 SECTION (target: ${targets.h2} words per H2 - DO NOT EXCEED):

## [H2 Title from Outline]

Opening paragraph (70-100 words):
- Introduce the concept
- Explain why it matters
- What readers will learn in this section

### [H3 Subsection 1 from Outline]

**Bold opening sentence that summarizes this subsection**

Write ${targets.h3} words covering:
- Step-by-step explanation or detailed breakdown
- Specific example with real numbers (e.g., "increases engagement by 45%")
- Tool names, metrics, data points
- Before/after scenario if applicable

### [H3 Subsection 2 from Outline]

**Bold opening sentence**

Write ${targets.h3} words covering:
- Build on previous subsection
- More detailed guidance
- Another specific example with data
- Comparison: "Method A vs Method B"

### [H3 Subsection 3 from Outline]

**Bold opening sentence**

Write ${targets.h3} words covering:
- Advanced technique or alternative approach
- Case study or real-world application
- Pro tip in blockquote: > **Pro Tip:** [advice]

### [H3 Subsection 4 from Outline]

**Bold opening sentence**

Write ${targets.h3} words covering:
- Common mistakes to avoid
- Best practices
- Troubleshooting advice

### [H3 Subsection 5 from Outline]

**Bold opening sentence**

Write ${targets.h3} words covering:
- Expert insights or industry trends
- Future outlook or emerging techniques
- Actionable takeaway

[Add comparison table if outline indicates one should go here]

### 5-Point Comparison: [Descriptive Title]

<table>
<thead>
<tr>
<th>Approach/Method</th>
<th>Complexity</th>
<th>Time Required</th>
<th>Cost</th>
<th>Best For</th>
<th>Key Benefit</th>
</tr>
</thead>
<tbody>
<tr>
<td>Option 1</td>
<td>Low</td>
<td>1-2 hours</td>
<td>Free</td>
<td>Beginners</td>
<td>Quick setup</td>
</tr>
<tr>
<td>Option 2</td>
<td>Medium</td>
<td>3-5 hours</td>
<td>$50-100</td>
<td>Professionals</td>
<td>Advanced features</td>
</tr>
<tr>
<td>Option 3</td>
<td>High</td>
<td>1-2 days</td>
<td>$200+</td>
<td>Enterprises</td>
<td>Full customization</td>
</tr>
</tbody>
</table>

MANDATORY COMPARISON TABLE RULES:
- If a section title mentions comparing products/apps/services (e.g., "Top 10 Best [Topic] Apps", "Best [Topic] Tools", "Comparing [Topic] Solutions"), you MUST create a comparison table with multiple options side-by-side
- If the title specifies a number (e.g., "Top 10", "5 Best", "7 Options"), the comparison table MUST include that many rows (or close to it, e.g., 8-10 rows for "Top 10")
- DO NOT just write individual descriptions for each option - create an actual comparison table first, then you can add detailed descriptions after the table if needed
- The comparison table should be the primary way to compare options - individual app/product descriptions are supplementary, not replacements
${websiteUrl ? `- NATURALLY INCORPORATE USER'S WEBSITE: When creating comparison tables about products, services, tools, or platforms that are relevant to ${websiteUrl}, naturally include it as one of the comparison options:
  * Analyze the article topic and determine if ${websiteUrl} is relevant to the comparison being made
  * If ${websiteUrl} offers products, services, tools, or solutions that match the comparison topic, include it as a row in the comparison table alongside other popular options
  * When a section title mentions "Top X" or "Best X" apps/tools/services, ${websiteUrl} should be included in that comparison table if it's relevant
  * Present it naturally as a legitimate option - use the website domain (${websiteUrl}) or a descriptive name based on what the site actually offers
  * Fill in all comparison columns with realistic, honest values based on what ${websiteUrl} actually provides - don't make it artificially superior, just present it as a real option with its actual features/benefits
  * Only include it when it's genuinely relevant to the comparison topic - don't force it into unrelated comparisons
  * Match the format and detail level of other rows in the table for consistency` : ''}

Transition paragraph (30-50 words) connecting to the next section.

FORMATTING REQUIREMENTS:
- Use **bold** for key terms on first mention
- Use bullet points for lists of 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
- Use HTML tables (with <table>, <thead>, <tbody>, <tr>, <th>, <td> tags) - NEVER use Markdown pipe tables
- Keep paragraphs 3-4 sentences max
- Use second-person ("you", "your")
- Conversational but authoritative tone

CRITICAL REQUIREMENTS:
- Write ALL sections indicated in the range (${sectionRange})
- Each H2 MUST be 400-550 words (not more)
- Each H3 MUST be 100-130 words (not more)
- Include specific numbers, metrics, and examples in every subsection
- Do NOT include labels like "Title:", "Meta Description:", "Introduction:", "Section 1:", "Content:", etc.
- Start directly with ## headings from the outline or paragraph text
- Do NOT skip sections - write every H2 and H3 from the outline
- Do NOT include instruction markers like "[Write...]", "[Add...]", "[Insert...]", etc.
- Do NOT include orphaned table headers without data rows - every table must be complete
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments
- STAY WITHIN 1,200-1,400 word limit for this phase

WORD COUNT TARGET: 1,200-1,400 words for this phase (not more). Count carefully and ensure you stay within this target.`;
}

function getFinalSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  businessName: string = 'our company',
  websiteUrl: string = '',
  businessDescription: string = '',
  contentLength: 'short' | 'medium' | 'long' = 'long'
): string {
  const phaseTargets = {
    short: { phase: '200-300', h2: '150-250', faq: '200-300', conclusion: '100-150', faqCount: '5-7', faqWords: '30-50' },
    medium: { phase: '400-600', h2: '250-350', faq: '400-600', conclusion: '150-200', faqCount: '6-8', faqWords: '50-70' },
    long: { phase: '1,500-1,800', h2: '400-550', faq: '800-1,000', conclusion: '200-250', faqCount: '8-10', faqWords: '50-70' }
  };
  const targets = phaseTargets[contentLength];
  
  return `You are writing the final sections of a ${contentLength === 'short' ? '1,000-1,500 word' : contentLength === 'medium' ? '2,000-3,000 word' : '3,800-4,200 word'} article about: "${topic}"

CRITICAL: TARGET LENGTH FOR THIS PHASE: ${targets.phase} words MAXIMUM. Do NOT exceed this limit.

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES:
${imageUrls.map((u, i) => `${i + 1}. ${u}${i === 0 ? ' (FEATURED IMAGE - do not embed in content)' : ' (embed using Markdown)'}`).join('\n')}
- IMPORTANT: Image #1 is reserved as the featured/header image - DO NOT embed it in the article content
- YOU MUST USE images #2 onwards (any remaining images not yet used in previous phases)

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write the following sections according to the outline:

PART 1: REMAINING H2 SECTIONS (if sections 9-12 exist in outline)

For each remaining H2 section, follow the same structure:
- H2 heading (from outline)
- Opening paragraph (70-100 words)
- 4-5 H3 subsections (100-130 words each)
- Each H3 starts with a **bold summary sentence**
- Include specific examples, data, metrics
- Add comparison tables where indicated
- Use > blockquotes for pro tips

Target: ${targets.h2} words per H2 section - DO NOT EXCEED

PART 2: FAQ SECTION (target: ${targets.faq} words MAXIMUM)

## FAQ

Write ${targets.faqCount} comprehensive questions and answers. Format:

**Q: How do [specific action] for [specific outcome]?**

[Opening answer sentence providing direct response]

[Second paragraph with more detail, specific examples, and data]

Target: ${targets.faqWords} words per FAQ answer - keep concise

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

PART 3: CONCLUSION (target: 350-450 words)

## Conclusion

Write a comprehensive conclusion with:

Paragraph 1 (70-90 words):
- Recap the main transformation or value proposition
- Emphasize the impact discussed in the article

Paragraph 2 (60-80 words):
- Key takeaways in bullet format:
  - Takeaway 1 with specific metric or insight
  - Takeaway 2 with actionable advice
  - Takeaway 3 with forward-looking perspective
  - Takeaway 4 with practical next step

Paragraph 3 (70-90 words):
- Discuss the future potential or next evolution
- Connect to broader trends

### Partner with ${businessName} for Success

Paragraph 4 (120-150 words):
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
- Use the business name "${businessName}" naturally within this CTA section

CRITICAL: DO NOT insert the business name "${businessName}" anywhere in the main article content (introduction, H2 sections, H3 subsections, or FAQ). The business name should ONLY appear in the "### Partner with ${businessName} for Success" subsection at the very end of the Conclusion. The main article should be general educational content without company mentions.

FORMATTING REQUIREMENTS:
- Use **bold** for emphasis
- Use HTML tables (with <table>, <thead>, <tbody>, <tr>, <th>, <td> tags) - NEVER use Markdown pipe tables
- Keep paragraphs 3-4 sentences max
- Second-person tone ("you", "your")
- No section labels like "Title:", "Meta Description:", "Introduction:", "Section 1:" - start with ## headings or paragraph text directly
- Include specific data and examples in FAQ answers

CRITICAL REQUIREMENTS:
- Write ALL remaining H2 sections from the outline
- Write 10-12 FAQ questions (not more)
- Each FAQ answer must be 50-70 words (not more)
- Conclusion must be 350-450 words total (including ${businessName} section)
- MANDATORY: Include "### Partner with ${businessName} for Success" subsection in Conclusion with clear CTA
- Do NOT include "SEO Suggestions" or "Image suggestions" sections
- Do NOT end with internal linking suggestions
- Do NOT include instruction markers like "# Remaining H2 Sections", "[Write...]", "[Add...]", etc.
- Do NOT include orphaned table headers without data rows
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments
- STAY WITHIN 1,200-1,400 word limit for this phase

WORD COUNT TARGET: 1,200-1,400 words for this phase (not more). Count carefully and ensure you stay within this target.`;
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
  websiteUrl: string = '',
  businessDescription: string = '',
  userId: string,
  currentCredits: number,
  requiredCredits: number,
  contentLength: 'short' | 'medium' | 'long' = 'long',
  maxTokens: number = 6000
) {
  const systemPrompt = generateContentSystemPrompt({
    keyword: topic,
    imageUrls,
    youtubeVideos: videos,
    isTest,
    businessName,
    websiteUrl,
    businessDescription,
    contentLength
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
            max_tokens: maxTokens,
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
          const decoder = new TextDecoder();
          let buffer = '';
          const safeBoundary = /[\s\n\t\r.,;:!?)]$/;

          const processLine = (rawLine: string) => {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) return;

            const data = line.slice(5).trimStart();
            if (data === '[DONE]') return;

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
              // Ignore parsing errors for incomplete chunks; they will be retried once buffer completes
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              processLine(line);
            }
          }

          if (buffer) {
            processLine(buffer);
          }

          if (carry) emit(carry);

          // Deduct credits after successful generation
          try {
            const { createClient: createServiceClient } = await import('@supabase/supabase-js');
            const serviceSupabase = createServiceClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            
            const { error: deductError } = await serviceSupabase
              .from('credits')
              .update({ credits: currentCredits - requiredCredits })
              .eq('user_id', userId);

            if (deductError) {
              console.error('⚠️ CRITICAL: Content generated successfully but failed to deduct credits:', deductError);
            } else {
              console.log(`✅ Deducted ${requiredCredits} credit(s) from user ${userId} for content generation. Remaining: ${currentCredits - requiredCredits}`);
            }
          } catch (creditError) {
            console.error('⚠️ Error deducting credits:', creditError);
          }

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
