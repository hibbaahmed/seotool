import { inngest, type Events } from '@/lib/inngest';
import { createClient } from '@/utils/supabase/server';

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
    return await step.sleepUntil('schedule-publish', publishDateTime, async () => {
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
