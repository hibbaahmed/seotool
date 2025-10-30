import { inngest, type Events } from '@/lib/inngest';
import { createClient } from '@/utils/supabase/server';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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
- Well-structured sections using Markdown headings (## for H2, ### for H3)
- Never write literal labels like "H2:" or "H3:" in the body
- Actionable insights and valuable information
- Natural keyword integration
- Internal linking opportunities
- A strong call-to-action

${relatedKeywords && relatedKeywords.length > 0 ? `Related keywords to naturally incorporate: ${relatedKeywords.join(', ')}` : ''}`;

        // Search for images using Tavily
        let imageUrls: string[] = [];
        
        if (process.env.TAVILY_API_KEY) {
          try {
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
              }
            }
          } catch (error) {
            console.error('Image search error:', error);
          }
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
          .single();

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

        const excerpt = (generatedContent.content || '').slice(0, 160) + '...';
        const result = await adapter.publish({
          title: keyword,
          html: generatedContent.content,
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
