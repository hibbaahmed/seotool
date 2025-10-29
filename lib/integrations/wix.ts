import { PublisherAdapter, PublishInput } from './publisher';

type WixConfig = {
  accessToken: string; // OAuth access token
  blogId: string; // Wix Blog identifier if required by API
};

export class WixAdapter implements PublisherAdapter {
  constructor(private config: WixConfig) {}

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`https://www.wixapis.com${path}`, {
      ...init,
      headers: {
        Authorization: this.config.accessToken,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Wix error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api('/blog/v3/blogs', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const payload: any = {
      post: {
        title: input.title,
        content: { html: input.html },
        excerpt: input.excerpt,
        tags: input.tags || [],
        status: input.when ? 'DRAFT' : 'PUBLISHED',
        publishStatus: input.when ? 'SCHEDULED' : 'PUBLISHED',
        publishDate: input.when,
      },
    };
    const res = await this.api('/blog/v3/posts', { method: 'POST', body: JSON.stringify(payload) });
    return { externalId: res.post?.id, url: res.post?.url };
  }

  supportsScheduling = true;
  supportsImages = false;
  supportsTags = true;
}






