import { PublisherAdapter, PublishInput } from './publisher';

type WPComConfig = {
  accessToken: string; // OAuth2 access token
  siteId: string; // WordPress.com site id
};

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

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const payload: any = {
      title: input.title,
      content: input.html,
      excerpt: input.excerpt,
      status: input.when ? 'future' : 'publish',
      date: input.when,
      tags: input.tags,
    };
    const res = await this.api(`/sites/${this.config.siteId}/posts/new`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { externalId: String(res.ID), url: res.URL };
  }

  supportsScheduling = true;
  supportsImages = true;
  supportsTags = true;
}






