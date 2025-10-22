import { PublisherAdapter, PublishInput } from './publisher';

type FramerConfig = {
  token: string;
  projectId: string;
  collectionId: string;
};

export class FramerAdapter implements PublisherAdapter {
  constructor(private config: FramerConfig) {}

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`https://api.framer.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Framer error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api(`/v3/projects/${this.config.projectId}`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const payload: any = {
      item: {
        title: input.title,
        body: input.html,
        excerpt: input.excerpt,
        tags: input.tags,
        slug: input.slug,
      },
    };
    const res = await this.api(`/v3/projects/${this.config.projectId}/cms/collections/${this.config.collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { externalId: res.item?.id, url: res.item?.url };
  }
}



