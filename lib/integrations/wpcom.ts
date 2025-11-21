import { uploadFeaturedImageToWPCom } from '../wordpress/featured-image';
import { PublisherAdapter, PublishInput } from './publisher';

type WPComConfig = {
  accessToken: string; // OAuth2 access token
  siteId: string; // WordPress.com site id
};

// Helper function for exponential backoff delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class WPComAdapter implements PublisherAdapter {
  constructor(private config: WPComConfig) {}

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`https://public-api.wordpress.com/rest/v1.1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`WP.com error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api(`/sites/${this.config.siteId}`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify that the published post contains the full content
   * WordPress.com sometimes truncates content without returning an error
   */
  private async verifyPublishedContent(postId: string, expectedContentLength: number): Promise<boolean> {
    try {
      console.log(`🔍 Verifying published post ${postId} content...`);
      const post = await this.api(`/sites/${this.config.siteId}/posts/${postId}`, {
        method: 'GET',
      });
      
      const publishedContentLength = post.content?.length || 0;
      const expectedMinLength = expectedContentLength * 0.95; // Allow 5% variance for HTML encoding differences
      
      console.log(`📊 Content verification: Published=${publishedContentLength} chars, Expected=${expectedContentLength} chars (min=${Math.floor(expectedMinLength)})`);
      
      if (publishedContentLength < expectedMinLength) {
        console.error(`❌ Content verification FAILED: Published content is ${Math.round((1 - publishedContentLength / expectedContentLength) * 100)}% shorter than expected`);
        return false;
      }
      
      console.log(`✅ Content verification PASSED: Full content published successfully`);
      return true;
    } catch (error) {
      console.error(`⚠️ Content verification error:`, error);
      // If verification fails, assume content is valid (don't fail on verification errors)
      return true;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const payload: any = {
      title: input.title,
      content: input.html,
      excerpt: input.excerpt,
      status: input.when ? 'future' : 'publish',
      date: input.when,
      tags: input.tags,
    };
    
    if (input.imageUrl) {
      const uploadedFeatured = await uploadFeaturedImageToWPCom(
        {
          accessToken: this.config.accessToken,
          siteId: this.config.siteId,
        },
        input.imageUrl,
        input.title
      );
      if (uploadedFeatured?.id) {
        payload.featured_image = uploadedFeatured.id;
        console.log('✅ Uploaded featured image via WordPress.com adapter');
      }
    }
    
    const expectedContentLength = input.html.length;
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Publishing to WordPress.com (attempt ${attempt}/${maxRetries})...`);
        
        const res = await this.api(`/sites/${this.config.siteId}/posts/new`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        const postId = String(res.ID);
        const postUrl = res.URL;
        
        console.log(`✅ WordPress.com API accepted post. ID: ${postId}, URL: ${postUrl}`);
        
        // Wait 2 seconds for WordPress to process the post
        await sleep(2000);
        
        // Verify the content was fully published
        const isContentComplete = await this.verifyPublishedContent(postId, expectedContentLength);
        
        if (!isContentComplete) {
          // Content was truncated - delete the incomplete post and retry
          console.error(`❌ Attempt ${attempt}: Content truncated, deleting incomplete post ${postId}...`);
          try {
            await this.api(`/sites/${this.config.siteId}/posts/${postId}/delete`, {
              method: 'POST',
              body: JSON.stringify({}),
            });
            console.log(`🗑️ Deleted incomplete post ${postId}`);
          } catch (deleteError) {
            console.error(`⚠️ Failed to delete incomplete post:`, deleteError);
          }
          
          throw new Error(`Content was truncated by WordPress.com (published ${Math.round((res.content?.length || 0) / expectedContentLength * 100)}% of expected length)`);
        }
        
        // Success - return the result
        console.log(`✅ Post published successfully with full content on attempt ${attempt}`);
        return { externalId: postId, url: postUrl };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ Attempt ${attempt} failed:`, lastError.message);
        
        // If this is not the last attempt, wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delayMs / 1000}s before retry...`);
          await sleep(delayMs);
        }
      }
    }
    
    // All retries failed
    throw new Error(`Failed to publish to WordPress.com after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  supportsScheduling = true;
  supportsImages = true;
  supportsTags = true;
}






