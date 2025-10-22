import { PublisherAdapter, PublishInput } from './publisher';

type ShopifyConfig = {
  storeDomain: string; // mystore.myshopify.com
  accessToken: string; // Admin API token
  blogId: number; // blog id
  apiVersion?: string; // default 2024-07
};

export class ShopifyAdapter implements PublisherAdapter {
  private base: string;
  private version: string;
  constructor(private config: ShopifyConfig) {
    this.version = config.apiVersion || '2024-07';
    this.base = `https://${config.storeDomain}/admin/api/${this.version}`;
  }

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Shopify error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api(`/blogs/${this.config.blogId}.json`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const payload = {
      article: {
        title: input.title,
        body_html: input.html,
        tags: (input.tags || []).join(', '),
        published: !input.when,
        published_at: input.when || undefined,
      },
    };
    const res = await this.api(`/blogs/${this.config.blogId}/articles.json`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { externalId: String(res.article.id), url: res.article.handle ? `https://${this.config.storeDomain}/blogs/${this.config.blogId}/${res.article.handle}` : undefined };
  }

  supportsScheduling = true;
  supportsImages = false;
  supportsTags = true;
}



