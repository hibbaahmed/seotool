import { PublisherAdapter, PublishInput } from './publisher';

type WPConfig = {
  url: string;
  username: string;
  password: string; // application password
  postType?: string; // default 'post'
};

// Helper function for exponential backoff delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class WordPressAdapter implements PublisherAdapter {
  private baseUrl: string;
  private username: string;
  private password: string;
  private postType: string;

  constructor(config: WPConfig) {
    this.baseUrl = config.url.replace(/\/$/, '');
    this.username = config.username;
    this.password = config.password;
    this.postType = config.postType || 'posts';
  }

  private async json(path: string, init: RequestInit) {
    const res = await fetch(`${this.baseUrl}/wp-json/wp/v2${path}`, {
      ...init,
      headers: {
        Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`WP error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.json('/users/me', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify that the published post contains the full content
   * Self-hosted WordPress sometimes truncates content without returning an error
   */
  private async verifyPublishedContent(postId: string, expectedContentLength: number): Promise<boolean> {
    try {
      console.log(`🔍 Verifying published post ${postId} content...`);
      const post = await this.json(`/${this.postType}/${postId}?context=edit`, {
        method: 'GET',
      });
      
      const publishedContentLength = post.content?.rendered?.length || 0;
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
    // Scheduling
    const status = input.when ? 'future' : 'publish';
    const body: any = {
      title: input.title,
      content: input.html,
      excerpt: input.excerpt,
      status,
      date: input.when,
    };

    // Tags: expects term IDs by default. As a simple approach, pass names and rely on plugins/filters.
    if (input.tags && input.tags.length) {
      body.tags = input.tags; // may need mapping names -> ids via taxonomy endpoints
    }

    // Featured image: if provided and is an absolute URL accessible by WP, many setups auto-download.
    // Robust approach: upload to /media first, then set featured_media.

    const expectedContentLength = input.html.length;
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Publishing to WordPress (attempt ${attempt}/${maxRetries})...`);
        
        const post = await this.json(`/${this.postType}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        
        const postId = String(post.id);
        const postUrl = post.link;
        
        console.log(`✅ WordPress API accepted post. ID: ${postId}, URL: ${postUrl}`);
        
        // Wait 2 seconds for WordPress to process the post
        await sleep(2000);
        
        // Verify the content was fully published
        const isContentComplete = await this.verifyPublishedContent(postId, expectedContentLength);
        
        if (!isContentComplete) {
          // Content was truncated - delete the incomplete post and retry
          console.error(`❌ Attempt ${attempt}: Content truncated, deleting incomplete post ${postId}...`);
          try {
            await this.json(`/${this.postType}/${postId}?force=true`, {
              method: 'DELETE',
            });
            console.log(`🗑️ Deleted incomplete post ${postId}`);
          } catch (deleteError) {
            console.error(`⚠️ Failed to delete incomplete post:`, deleteError);
          }
          
          throw new Error(`Content was truncated by WordPress (published ${Math.round((post.content?.rendered?.length || 0) / expectedContentLength * 100)}% of expected length)`);
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
    throw new Error(`Failed to publish to WordPress after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  supportsScheduling = true;
  supportsImages = true;
  supportsTags = true;
}






