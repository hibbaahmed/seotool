// WordPress REST API Integration Service

import { marked } from 'marked';

export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string; // Application password
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish' | 'private' | 'pending';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, any>;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export class WordPressAPI {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(site: WordPressSite) {
    this.baseUrl = site.url.replace(/\/$/, '');
    this.username = site.username;
    this.password = site.password;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/wp-json/wp/v2${endpoint}`;
    const auth = btoa(`${this.username}:${this.password}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private convertMarkdownToHtml(markdown: string): string {
    // Convert markdown to HTML and return as string
    let html = marked.parse(markdown, { async: false });
    html = typeof html === 'string' ? html : String(html);
    
    // Ensure markdown images are converted to HTML (in case marked didn't convert them)
    // Convert ![alt](url) to <img src="url" alt="alt" />
    if (html.includes('![') && html.includes('](')) {
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
    }
    
    // Add inline styles for proper spacing (ensures spacing regardless of theme CSS)
    html = this.addInlineSpacing(html);
    
    return html;
  }

  private addInlineSpacing(html: string): string {
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
    
    // Add professional styling to tables
    html = html.replace(/<table>/gi, '<table style="margin-top: 2rem; margin-bottom: 2rem; width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); font-size: 15px; border: none;">');
    html = html.replace(/<thead>/gi, '<thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">');
    html = html.replace(/<th>/gi, '<th style="color: white; font-weight: 600; text-align: left; padding: 16px 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border: none;">');
    html = html.replace(/<td>/gi, '<td style="padding: 16px 20px; color: #374151; line-height: 1.6; border: none; border-bottom: 1px solid #e5e7eb;">');
    html = html.replace(/<tr>/gi, '<tr style="transition: background-color 0.2s ease;">');
    
    // Remove top margin from first paragraph
    html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
    
    return html;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/users/me');
      return true;
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return false;
    }
  }

  // Get site info
  async getSiteInfo() {
    return this.makeRequest('/');
  }

  // Create a new post
  async createPost(post: WordPressPost): Promise<WordPressPost> {
    const postWithHtmlContent = {
      ...post,
      content: this.convertMarkdownToHtml(post.content),
    };

    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postWithHtmlContent),
    });
  }

  // Update an existing post
  async updatePost(id: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    const postWithHtmlContent = {
      ...post,
      ...(post.content ? { content: this.convertMarkdownToHtml(post.content) } : {}),
    };

    return this.makeRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postWithHtmlContent),
    });
  }

  // Get all posts
  async getPosts(params: {
    per_page?: number;
    page?: number;
    status?: string;
    search?: string;
  } = {}): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const queryString = queryParams.toString();
    return this.makeRequest(`/posts${queryString ? `?${queryString}` : ''}`);
  }

  // Get categories
  async getCategories(): Promise<WordPressCategory[]> {
    return this.makeRequest('/categories');
  }

  // Create category
  async createCategory(name: string, slug?: string): Promise<WordPressCategory> {
    return this.makeRequest('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
  }

  // Get tags
  async getTags(): Promise<WordPressTag[]> {
    return this.makeRequest('/tags?per_page=100');
  }

  // Create tag
  async createTag(name: string, slug?: string): Promise<WordPressTag> {
    return this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
  }

  /**
   * Get or create tag IDs from tag names
   * If a tag doesn't exist, it will be created
   */
  async getOrCreateTagIds(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const tagName of tagNames) {
      try {
        // First, try to find existing tag
        const existingTags = await this.getTags();
        const existingTag = existingTags.find(
          tag => tag.name.toLowerCase() === tagName.toLowerCase()
        );

        if (existingTag) {
          tagIds.push(existingTag.id);
        } else {
          // Tag doesn't exist, create it
          const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const newTag = await this.createTag(tagName, slug);
          tagIds.push(newTag.id);
        }
      } catch (error) {
        console.error(`Error processing tag "${tagName}":`, error);
        // Continue with other tags even if one fails
      }
    }

    return tagIds;
  }

  // Upload media
  async uploadMedia(file: File, alt?: string): Promise<{ id: number; source_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) formData.append('alt_text', alt);

    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.username}:${this.password}`)}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Media upload failed: ${response.status}`);
    }

    return response.json();
  }

  // Schedule a post
  async schedulePost(post: WordPressPost, publishDate: string): Promise<WordPressPost> {
    const postWithHtmlContent = {
      ...post,
      content: this.convertMarkdownToHtml(post.content),
      status: 'future' as const,
      date: publishDate,
    };

    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postWithHtmlContent),
    });
  }

  // Bulk publish posts
  async bulkPublishPosts(posts: WordPressPost[]): Promise<WordPressPost[]> {
    const results = await Promise.allSettled(
      posts.map(post => this.createPost(post))
    );
    
    return results
      .filter((result): result is PromiseFulfilledResult<WordPressPost> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  // Delete a post
  async deletePost(id: number): Promise<{ deleted: boolean; previous: WordPressPost }> {
    return this.makeRequest(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Get a single post
  async getPost(id: number): Promise<WordPressPost> {
    return this.makeRequest(`/posts/${id}`);
  }

  // Get posts by category
  async getPostsByCategory(categoryId: number, params: {
    per_page?: number;
    page?: number;
    status?: string;
  } = {}): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('categories', categoryId.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/posts?${queryParams.toString()}`);
  }

  // Get posts by tag
  async getPostsByTag(tagId: number, params: {
    per_page?: number;
    page?: number;
    status?: string;
  } = {}): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('tags', tagId.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/posts?${queryParams.toString()}`);
  }

  // Search posts
  async searchPosts(query: string, params: {
    per_page?: number;
    page?: number;
    status?: string;
  } = {}): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.makeRequest(`/posts?${queryParams.toString()}`);
  }

  // Get media by post ID
  async getPostMedia(postId: number): Promise<any[]> {
    return this.makeRequest(`/media?parent=${postId}`);
  }

  // Update post status
  async updatePostStatus(id: number, status: 'draft' | 'publish' | 'private' | 'pending'): Promise<WordPressPost> {
    return this.makeRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Duplicate a post
  async duplicatePost(id: number, newTitle?: string): Promise<WordPressPost> {
    const originalPost = await this.getPost(id);
    
    const duplicatedPost = {
      ...originalPost,
      title: newTitle || `${originalPost.title} (Copy)`,
      status: 'draft' as const,
    };

    // Remove the ID so WordPress creates a new post
    delete duplicatedPost.id;

    return this.createPost(duplicatedPost);
  }
}