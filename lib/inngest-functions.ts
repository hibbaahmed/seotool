import { inngest, type Events } from '@/lib/inngest';
import { createClient } from '@/utils/supabase/server';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { marked } from 'marked';

// Function to schedule a blog post for publishing
export const scheduleBlogPost = inngest.createFunction(
  { id: 'schedule-blog-post' },
  { event: 'blog/post.schedule' },
  async ({ event, step }) => {
    const { postId, scheduledDate, scheduledTime, platform, title, content, userId, imageUrls, notes } = event.data;

    // Calculate the exact publish time
    const publishDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    // If the scheduled time is in the past, publish immediately
    if (publishDateTime <= now) {
      return await step.run('publish-immediately', async () => {
        await inngest.send({
          name: 'blog/post.publish',
          data: {
            postId,
            platform,
            title,
            content,
            userId,
            imageUrls,
          },
        });
      });
    }

    // Schedule the post for future publishing
    await step.sleepUntil('schedule-publish', publishDateTime);
    
    await inngest.send({
      name: 'blog/post.publish',
      data: {
        postId,
        platform,
        title,
        content,
        userId,
        imageUrls,
      },
    });
  }
);

// Function to publish a blog post
export const publishBlogPost = inngest.createFunction(
  { id: 'publish-blog-post' },
  { event: 'blog/post.publish' },
  async ({ event, step }) => {
    const { postId, platform, title, content, userId, imageUrls, publishUrl } = event.data;

    // Update post status to published
    const supabase = await createClient();
    
    const updateResult = await step.run('update-post-status', async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'published',
          publish_url: publishUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating post status:', error);
        throw new Error(`Failed to update post status: ${error.message}`);
      }

      return data;
    });

    // Platform-specific publishing logic
    const publishResult = await step.run('publish-to-platform', async () => {
      switch (platform) {
        case 'wordpress':
          return await publishToWordPress(title, content, imageUrls);
        case 'medium':
          return await publishToMedium(title, content, imageUrls);
        case 'linkedin':
          return await publishToLinkedIn(title, content, imageUrls);
        case 'twitter':
          return await publishToTwitter(title, content, imageUrls);
        case 'blog':
        default:
          return await publishToBlog(title, content, imageUrls);
      }
    });

    // Update post with publish URL if available
    if (publishResult?.url) {
      await step.run('update-publish-url', async () => {
        await supabase
          .from('scheduled_posts')
          .update({ publish_url: publishResult.url })
          .eq('id', postId)
          .eq('user_id', userId);
      });
    }

    return {
      success: true,
      postId,
      platform,
      publishUrl: publishResult?.url,
    };
  }
);

// Function to cancel a scheduled post
export const cancelBlogPost = inngest.createFunction(
  { id: 'cancel-blog-post' },
  { event: 'blog/post.cancel' },
  async ({ event, step }) => {
    const { postId, userId } = event.data;

    const supabase = await createClient();

    return await step.run('cancel-post', async () => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling post:', error);
        throw new Error(`Failed to cancel post: ${error.message}`);
      }

      return data;
    });
  }
);

// Platform-specific publishing functions
async function publishToWordPress(title: string, content: string, imageUrls?: string[]) {
  // Implement WordPress publishing logic
  // This would integrate with WordPress REST API
  console.log('Publishing to WordPress:', title);
  
  // Example implementation:
  // const response = await fetch('https://your-wordpress-site.com/wp-json/wp/v2/posts', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.WORDPRESS_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     title,
  //     content,
  //     status: 'publish',
  //   }),
  // });
  
  return { url: `https://your-wordpress-site.com/posts/${Date.now()}` };
}

async function publishToMedium(title: string, content: string, imageUrls?: string[]) {
  // Implement Medium publishing logic
  console.log('Publishing to Medium:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.medium.com/v1/posts', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.MEDIUM_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     title,
  //     contentFormat: 'html',
  //     content,
  //     publishStatus: 'public',
  //   }),
  // });
  
  return { url: `https://medium.com/@your-username/${Date.now()}` };
}

async function publishToLinkedIn(title: string, content: string, imageUrls?: string[]) {
  // Implement LinkedIn publishing logic
  console.log('Publishing to LinkedIn:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.linkedin.com/v2/shares', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.LINKEDIN_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
  //     lifecycleState: 'PUBLISHED',
  //     specificContent: {
  //       'com.linkedin.ugc.ShareContent': {
  //         shareCommentary: {
  //           text: content,
  //         },
  //         shareMediaCategory: 'NONE',
  //       },
  //     },
  //   }),
  // });
  
  return { url: `https://linkedin.com/feed/update/${Date.now()}` };
}

async function publishToTwitter(title: string, content: string, imageUrls?: string[]) {
  // Implement Twitter/X publishing logic
  console.log('Publishing to Twitter:', title);
  
  // Example implementation:
  // const response = await fetch('https://api.twitter.com/2/tweets', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.TWITTER_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     text: content.substring(0, 280), // Twitter character limit
  //   }),
  // });
  
  return { url: `https://twitter.com/your-username/status/${Date.now()}` };
}

async function publishToBlog(title: string, content: string, imageUrls?: string[]) {
  // For your own blog platform
  console.log('Publishing to blog:', title);
  
  // This could save to your own database, generate static files, etc.
  return { url: `https://your-blog.com/posts/${Date.now()}` };
}

// Daily cron job to check and generate content for scheduled keywords at 6 AM
export const dailyContentGeneration = inngest.createFunction(
  { 
    id: 'daily-content-generation',
    name: 'Daily Content Generation at 6 AM'
  },
  { cron: '0 6 * * *' }, // Run every day at 6 AM
  async ({ event, step }) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`🕐 Daily content generation check for ${today}`);

    // Get all keywords scheduled for today
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const keywords = await step.run('fetch-scheduled-keywords', async () => {
      const { data, error } = await supabase
        .from('discovered_keywords')
        .select('*')
        .eq('scheduled_date', today)
        .eq('scheduled_for_generation', true)
        .eq('generation_status', 'pending');

      if (error) {
        console.error('Error fetching scheduled keywords:', error);
        return [];
      }

      console.log(`📋 Found ${data?.length || 0} keywords to generate for ${today}`);
      return data || [];
    });

    // Generate content for each keyword
    for (const keyword of keywords) {
      await step.run(`generate-content-${keyword.id}`, async () => {
        try {
          console.log(`🚀 Generating content for keyword: ${keyword.keyword}`);
          
          // Send event to generate content for this keyword
          await inngest.send({
            name: 'calendar/keyword.generate',
            data: {
              keywordId: keyword.id,
              keyword: keyword.keyword,
              userId: keyword.user_id,
              relatedKeywords: keyword.related_keywords,
            },
          });
          
          return { success: true, keyword: keyword.keyword };
        } catch (error) {
          console.error(`Error generating content for keyword ${keyword.id}:`, error);
          
          // Update keyword status to failed
          await supabase
            .from('discovered_keywords')
            .update({ generation_status: 'failed' })
            .eq('id', keyword.id);
          
          return { success: false, keyword: keyword.keyword, error };
        }
      });
    }

    return {
      date: today,
      keywordsProcessed: keywords.length,
    };
  }
);

// Event-based scheduling: schedule a single keyword at an exact time
export const scheduleKeywordGeneration = inngest.createFunction(
  {
    id: 'schedule-keyword-generation',
    name: 'Schedule Keyword Generation at Specific Time'
  },
  { event: 'calendar/keyword.schedule' },
  async ({ event, step }) => {
    const { keywordId, keyword, userId, runAtISO, relatedKeywords } = event.data;

    // Sleep until the specified datetime
    await step.sleepUntil('wait-until-scheduled-time', new Date(runAtISO));

    // Then trigger the actual generation
    await inngest.send({
      name: 'calendar/keyword.generate',
      data: { keywordId, keyword, userId, relatedKeywords }
    });

    return { scheduledFor: runAtISO, keywordId };
  }
);

// Function to generate content for a single keyword
export const generateKeywordContent = inngest.createFunction(
  { 
    id: 'generate-keyword-content',
    name: 'Generate Content for Keyword'
  },
  { event: 'calendar/keyword.generate' },
  async ({ event, step }) => {
    const { keywordId, keyword, userId, relatedKeywords } = event.data;

    console.log(`📝 Starting content generation for: ${keyword}`);

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update status to generating
    await step.run('update-status-generating', async () => {
      await supabase
        .from('discovered_keywords')
        .update({ generation_status: 'generating' })
        .eq('id', keywordId);
    });

    // Generate content using Claude
    const generatedContent = await step.run('generate-content', async () => {
      try {
        const contentPrompt = `Topic: "${keyword}"
Content Type: blog post
Target Audience: General audience
Tone: professional
Length: Long-form (1500-2500 words)

Please create comprehensive, SEO-optimized content for this topic. Include:
- An engaging title and meta description
- Start directly with 2-4 introductory paragraphs after the main title (NO "Introduction:" heading or label)
- Well-structured sections using Markdown headings (## for H2, ### for H3)
- Never write literal labels like "H2:", "H3:", "Introduction:", or "Understanding [Topic]:" in the body
- Paragraphs should flow directly after the main title and after subheadings
- Actionable insights and valuable information
- Natural keyword integration
- Internal linking opportunities
- End the article with a single closing call-to-action paragraph, WITHOUT any heading label

${relatedKeywords && relatedKeywords.length > 0 ? `Related keywords to naturally incorporate: ${relatedKeywords.join(', ')}` : ''}`;

        // Search for images using Tavily
        let imageUrls: string[] = [];
        
        if (process.env.TAVILY_API_KEY) {
          try {
            console.log('🔍 [Inngest] Searching for images via Tavily for keyword:', keyword);
            const tavilyResponse = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: keyword,
                search_depth: 'basic',
                include_images: true,
                max_results: 5
              })
            });

            if (tavilyResponse.ok) {
              const tavilyData = await tavilyResponse.json();
              if (tavilyData.images && tavilyData.images.length > 0) {
                imageUrls = tavilyData.images.filter(Boolean);
                console.log('🖼️ [Inngest] Found images from Tavily:', imageUrls.length);
              } else {
                console.log('⚠️ [Inngest] Tavily returned no images');
              }
            } else {
              console.warn('⚠️ [Inngest] Tavily API error:', tavilyResponse.status);
            }
          } catch (error) {
            console.error('❌ [Inngest] Image search error:', error);
          }
        } else {
          console.warn('⚠️ [Inngest] TAVILY_API_KEY not set, skipping image search');
        }

        // Use demo images if no images found
        if (imageUrls.length === 0) {
          imageUrls = [
            'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
            'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800'
          ];
        }

        // Upload images to Supabase Storage
        const uploadedImageUrls: string[] = [];
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            const response = await fetch(imageUrls[i], {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              },
            });

            if (response.ok) {
              const imageBlob = await response.blob();
              const contentType = response.headers.get('Content-Type') || 'image/jpeg';
              const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2)}`;
              const ext = contentType.includes('png') ? 'png' : 'jpg';
              const filePath = `user_uploads/${userId}/${id}.${ext}`;

              const uploadResult = await supabase.storage
                .from('photos')
                .upload(filePath, imageBlob, {
                  cacheControl: '3600',
                  upsert: true,
                  contentType,
                });

              if (!uploadResult.error) {
                const { data: publicUrlData } = supabase.storage
                  .from('photos')
                  .getPublicUrl(filePath);
                
                if (publicUrlData?.publicUrl) {
                  uploadedImageUrls.push(publicUrlData.publicUrl);
                }
              }
            }
          } catch (error) {
            console.error(`Error uploading image ${i}:`, error);
          }
        }

        // Build system prompt with images (same format as content-writer API)
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

[Start directly with 2-4 engaging introductory paragraphs. NO "Introduction:" heading or label. Just write compelling paragraphs that hook the reader and provide context. Each paragraph should be 1-3 sentences. Use blank lines to separate paragraphs.]

[Then continue with H2 sections (## Section Title) followed by their paragraphs directly - no labels like "Understanding..." or "Introduction:" before paragraphs. Subheadings should be clear and descriptive, followed immediately by relevant paragraphs.]

[Continue with more H2/H3 sections as needed, each with their paragraphs flowing naturally below the subheading.]

[End the Content section with a single closing call-to-action paragraph. Do NOT add any heading like "Call-to-Action:"—just write the CTA as a normal paragraph.]

4. **SEO Suggestions**
- [3-5 internal link anchor ideas]
- [Image suggestions if any]

CRITICAL RULES:
- NEVER split words across lines (e.g., "Generatio\nn" is FORBIDDEN). If a word would wrap, write it fully on the next line.
- Headings (##/###) MUST be complete on ONE line. If too long, rewrite shorter instead of breaking.
- Use proper Markdown only (## for H2, ### for H3, - for bullets, **bold** as needed).
- DO NOT use section labels like "Introduction:", "Call-to-Action:", or "Understanding [Topic]:" before paragraphs. Start paragraphs immediately after the main title and after subheadings.
- Keep paragraphs short (1–3 sentences). Use blank lines between blocks.
- Aim for 1,500–2,500 words. Tone: professional yet conversational, 8th–10th grade, active voice.`;

        // Generate content with Claude
        const modelsToTry: string[] = [
          process.env.ANTHROPIC_MODEL as string,
          'claude-3-5-sonnet-20240620',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ].filter(Boolean);

        let content = '';
        let uploadedImageUrlsLocal = uploadedImageUrls;
        let lastErrorText = '';
        let lastStatus = 0;

        for (const model of modelsToTry) {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model,
              max_tokens: 4000,
              system: systemPrompt,
              messages: [{ role: 'user', content: contentPrompt }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            content = data.content?.[0]?.text || '';
            break;
          }

          // Capture error and decide whether to try next model
          lastStatus = response.status;
          lastErrorText = await response.text();
          console.error(`Claude API error for model ${model}:`, lastErrorText);

          // If the error is model-not-found, try the next model; otherwise, abort early
          if (!(response.status === 404 && /model/i.test(lastErrorText))) {
            throw new Error(`Claude API error: ${response.status} - ${lastErrorText}`);
          }
        }

        if (!content) {
          throw new Error(
            `No compatible Claude model available. Last error (${lastStatus}): ${lastErrorText}`
          );
        }

        return {
          content,
          imageUrls: uploadedImageUrlsLocal,
        };
      } catch (error) {
        console.error('Error generating content:', error);
        throw error;
      }
    });

    // Save generated content to database
    const savedContent = await step.run('save-content', async () => {
      const { data, error } = await supabase
        .from('content_writer_outputs')
        .insert({
          user_id: userId,
          topic: keyword,
          content_type: 'blog post',
          target_audience: 'General audience',
          tone: 'professional',
          length: 'long',
          content_output: generatedContent.content,
          image_urls: generatedContent.imageUrls,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving content:', error);
        throw error;
      }

      return data;
    });

    // Update keyword with generated content reference
    await step.run('update-keyword-status', async () => {
      await supabase
        .from('discovered_keywords')
        .update({
          generation_status: 'generated',
          generated_content_id: savedContent.id,
          generated_at: new Date().toISOString(),
        })
        .eq('id', keywordId);
    });

    // Auto-publish to user's connected WordPress site if available
    await step.run('auto-publish-to-wordpress', async () => {
      try {
        const { data: site } = await supabase
          .from('wordpress_sites')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!site) {
          console.log('No active WordPress site connected; skipping auto-publish');
          return;
        }

        const provider = site.provider || (site.access_token ? 'wpcom' : 'wordpress');
        const adapter = getAdapter(provider, {
          accessToken: site.access_token,
          siteId: site.site_id,
          url: site.url,
          username: site.username,
          password: site.password,
          postType: site.post_type,
        });

        // Extract title from content_output (same logic as manual publish route)
        const contentOutput = generatedContent.content || '';
        let extractedTitle = keyword;
        
        // First, try to extract from Title section
        const titlePatterns = [
          /(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n([^\n]+)/i,
          /(?:^|\n)Title:\s*"?([^"\n]+)"?/i,
          /(?:^|\n)\*\*Title\*\*[:\s]*\n([^\n]+)/i
        ];
        for (const pattern of titlePatterns) {
          const match = contentOutput.match(pattern);
          if (match && match[1]) {
            extractedTitle = match[1].trim().replace(/^["']|["']$/g, '');
            break;
          }
        }
        
        // If title not found yet, try to extract from H1 in content section
        const contentSectionMatch = contentOutput.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/i);
        if (contentSectionMatch) {
          const afterContent = contentOutput.substring(contentSectionMatch.index! + contentSectionMatch[0].length);
          const h1Match = afterContent.match(/^#\s+([^\n]+)/m);
          if (h1Match && h1Match[1]) {
            const h1Title = h1Match[1].trim();
            if (h1Title.length > 10 && !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action)/i)) {
              extractedTitle = h1Title;
            }
          }
        }
        
        // Extract and clean content (same logic as extractContentFromAIOutput)
        let cleaned = contentOutput;
        
        // Remove numbered sections
        cleaned = cleaned.replace(/^\d+\.?\s*\*\*Title\*\*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*Title:.*$/gmi, '');
        cleaned = cleaned.replace(/^\*\*Title\*\*[:\s]*.*$/gmi, '');
        cleaned = cleaned.replace(/^Title:\s*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*\*\*Meta Description\*\*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*Meta Description:.*$/gmi, '');
        cleaned = cleaned.replace(/^\*\*Meta Description\*\*[:\s]*.*$/gmi, '');
        cleaned = cleaned.replace(/^Meta Description:\s*.*$/gmi, '');
        
        // Extract Content section
        const contentPatterns = [
          /(?:^|\n)\d+\.?\s*\*\*Content\*\*[:\s]*\n?(.*)$/is,
          /(?:^|\n)\*\*Content\*\*[:\s]*\n?(.*)$/is,
          /(?:^|\n)3\.\s+\*\*Content\*\*[:\s]*\n?(.*)$/is
        ];
        
        let extractedContent = '';
        for (const pattern of contentPatterns) {
          const match = cleaned.match(pattern);
          if (match && match[1]) {
            extractedContent = match[1];
            break;
          }
        }
        
        if (!extractedContent) {
          extractedContent = cleaned;
        }
        
        // Remove duplicate H1 title at the start
        const lines = extractedContent.split('\n');
        let startIndex = 0;
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          if (line.match(/^#\s+.+$/)) {
            startIndex = i + 1;
            while (startIndex < lines.length && lines[startIndex].trim() === '') {
              startIndex++;
            }
            break;
          } else if (line && !line.startsWith('#') && !line.match(/^\d+\./)) {
            startIndex = i;
            break;
          }
        }
        extractedContent = lines.slice(startIndex).join('\n');
        
        // Remove remaining numbered sections
        extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
        extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
        
        // Remove trailing sections
        const stopKeywords = [
          '\n4. **SEO Suggestions',
          '\n**SEO Suggestions**',
          '\n## SEO Suggestions',
          '\n4. **Image Suggestions',
          '\n**Image Suggestions**',
          '\n## Image Suggestions',
          '\n5. **Call-to-Action',
          '\n**Call-to-Action**',
          '\n## Call-to-Action'
        ];
        for (const stopKeyword of stopKeywords) {
          const index = extractedContent.indexOf(stopKeyword);
          if (index !== -1) {
            extractedContent = extractedContent.substring(0, index);
            break;
          }
        }
        
        // Clean up whitespace
        extractedContent = extractedContent
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+/gm, '')
          .trim();
        
        // Apply paragraph spacing (ensure blank lines between paragraphs)
        const linesArray = extractedContent.split('\n');
        const spacedLines: string[] = [];
        
        for (let i = 0; i < linesArray.length; i++) {
          const currentLine = linesArray[i];
          const currentTrimmed = currentLine.trim();
          
          spacedLines.push(currentLine);
          
          // Check if we need to add spacing after this line
          if (i < linesArray.length - 1) {
            const nextLine = linesArray[i + 1];
            const nextTrimmed = nextLine.trim();
            
            // Skip if current line is already blank
            if (!currentTrimmed) {
              continue;
            }
            
            // If current line is a paragraph (non-structural) and next line is also a paragraph
            const isCurrentParagraph = currentTrimmed && 
                !currentTrimmed.startsWith('#') &&
                !currentTrimmed.startsWith('![') &&
                !currentTrimmed.startsWith('>') &&
                !currentTrimmed.startsWith('|') &&
                !currentTrimmed.startsWith('- ') &&
                !currentTrimmed.startsWith('* ') &&
                !/^\d+\.\s/.test(currentTrimmed);
            
            const isNextParagraph = nextTrimmed &&
                !nextTrimmed.startsWith('#') &&
                !nextTrimmed.startsWith('![') &&
                !nextTrimmed.startsWith('>') &&
                !nextTrimmed.startsWith('|') &&
                !nextTrimmed.startsWith('- ') &&
                !nextTrimmed.startsWith('* ') &&
                !/^\d+\.\s/.test(nextTrimmed);
            
            if (isCurrentParagraph && isNextParagraph) {
              // Check if there's NOT already a blank line between them
              let hasBlankLine = false;
              for (let j = i + 1; j < linesArray.length && j <= i + 2; j++) {
                if (!linesArray[j].trim()) {
                  hasBlankLine = true;
                  break;
                }
                // If we hit another paragraph or structural element, stop looking
                if (linesArray[j].trim() && 
                    (linesArray[j].trim().startsWith('#') || 
                     linesArray[j].trim().startsWith('![') ||
                     linesArray[j].trim().startsWith('>') ||
                     linesArray[j].trim().startsWith('|') ||
                     linesArray[j].trim().startsWith('- ') ||
                     linesArray[j].trim().startsWith('* ') ||
                     /^\d+\.\s/.test(linesArray[j].trim()))) {
                  break;
                }
              }
              
              if (!hasBlankLine) {
                spacedLines.push('');
              }
            }
          }
        }
        
        extractedContent = spacedLines.join('\n');
        // Clean up any triple+ newlines (should be max 2)
        extractedContent = extractedContent.replace(/\n{3,}/g, '\n\n');
        
        // Convert markdown to HTML
        let htmlContent = marked.parse(extractedContent, { async: false }) as string;
        // Ensure markdown images are converted (fallback)
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        }
        
        const excerpt = extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...';
        const result = await adapter.publish({
          title: extractedTitle,
          html: htmlContent,
          excerpt,
          tags: ['ai-generated', 'seotool'],
        });

        console.log('Auto-published to WordPress:', result);
      } catch (err) {
        console.error('Auto-publish failed:', err);
      }
    });

    console.log(`✅ Content generated successfully for: ${keyword}`);

    return {
      success: true,
      keywordId,
      contentId: savedContent.id,
    };
  }
);
