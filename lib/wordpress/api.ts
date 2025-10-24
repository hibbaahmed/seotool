// WordPress REST API Integration Service
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
  tags?: string[];
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
    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  // Update an existing post
  async updatePost(id: number, post: Partial<WordPressPost>): Promise<WordPressPost> {
    return this.makeRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post),
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
    return this.makeRequest('/tags');
  }

  // Create tag
  async createTag(name: string, slug?: string): Promise<WordPressTag> {
    return this.makeRequest('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
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
    return this.makeRequest('/posts', {
      method: 'POST',
      body: JSON.stringify({
        ...post,
        status: 'future',
        date: publishDate,
      }),
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
