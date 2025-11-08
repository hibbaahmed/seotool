import { inngest, type Events } from '@/lib/inngest';
import { createClient } from '@/utils/supabase/server';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { marked } from 'marked';

// Helper function to add inline spacing styles to HTML
function addInlineSpacing(html: string): string {
  // Add inline styles to ensure proper spacing in WordPress
  // This ensures spacing works regardless of the WordPress theme's CSS
  
  // Add spacing to paragraphs (1.5em top and bottom)
  html = html.replace(/<p>/gi, '<p style="margin-top: 1.5em; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Add spacing to headings
  html = html.replace(/<h2>/gi, '<h2 style="margin-top: 2em; margin-bottom: 1em; font-weight: 700;">');
  html = html.replace(/<h3>/gi, '<h3 style="margin-top: 1.75em; margin-bottom: 0.875em; font-weight: 700;">');
  html = html.replace(/<h4>/gi, '<h4 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h5>/gi, '<h5 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h6>/gi, '<h6 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  
  // Remove top margin from first paragraph
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  
  return html;
}

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
// This function calls the /api/calendar/generate endpoint which uses multi-phase generation
export const generateKeywordContent = inngest.createFunction(
  { 
    id: 'generate-keyword-content',
    name: 'Generate Content for Keyword'
  },
  { event: 'calendar/keyword.generate' },
  async ({ event, step }) => {
    const { keywordId, keyword, userId, relatedKeywords } = event.data;

    console.log(`🚀 Starting content generation for: ${keyword} (ID: ${keywordId})`);

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the base URL for the API call
    const getBaseUrl = (): string => {
      if (process.env.NEXT_PUBLIC_URL) {
        const url = process.env.NEXT_PUBLIC_URL.trim();
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        return `https://${url}`;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      return 'http://localhost:3000';
    };
    
    const baseUrl = getBaseUrl();

    // Call the /api/calendar/generate endpoint to trigger content generation
    const result = await step.run('call-generate-api', async () => {
      try {
        console.log(`📡 Calling /api/calendar/generate for keyword: ${keyword}`);
        
        // Verify user exists
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData.user) {
          console.error(`❌ User not found: ${userId}`, userError);
          // Update keyword status to failed
          await supabase
            .from('discovered_keywords')
            .update({ generation_status: 'failed' })
            .eq('id', keywordId);
          
          return { success: false, error: 'User not found' };
        }

        // Use service role key for authentication (server-to-server)
        const response = await fetch(`${baseUrl}/api/calendar/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-supabase-service-role': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'x-user-id': userId, // Pass user ID for server-side auth
          },
          body: JSON.stringify({
            keyword_id: keywordId,
            keyword: keyword,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API call failed: ${response.status} ${errorText}`);
          
          // Update keyword status to failed
          await supabase
            .from('discovered_keywords')
            .update({ generation_status: 'failed' })
            .eq('id', keywordId);
          
          return { success: false, error: `API returned ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        console.log(`✅ Content generated successfully for: ${keyword}`);
        
        return { success: true, data };
      } catch (error: any) {
        console.error(`❌ Error calling generate API:`, error);
        
        // Update keyword status to failed
        await supabase
          .from('discovered_keywords')
          .update({ generation_status: 'failed' })
          .eq('id', keywordId);
        
        return { success: false, error: error.message };
      }
    });

    if (!result.success) {
      return {
        keywordId,
        keyword,
        success: false,
        error: 'error' in result ? result.error : 'Unknown error',
      };
    }

    return {
      keywordId,
      keyword,
      success: true,
      data: 'data' in result ? result.data : undefined,
    };
  }
);
