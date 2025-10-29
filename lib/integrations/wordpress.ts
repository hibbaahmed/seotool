import { PublisherAdapter, PublishInput } from './publisher';

type WPConfig = {
  url: string;
  username: string;
  password: string; // application password
  postType?: string; // default 'post'
};

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

    const post = await this.json(`/${this.postType}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { externalId: String(post.id), url: post.link };
  }

  supportsScheduling = true;
  supportsImages = true;
  supportsTags = true;
}






