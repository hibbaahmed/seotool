import { PublisherAdapter, PublishInput } from './publisher';

type WebflowConfig = {
  token: string; // PAT or OAuth access token
  siteId: string;
  collectionId: string;
};

export class WebflowAdapter implements PublisherAdapter {
  constructor(private config: WebflowConfig) {}

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`https://api.webflow.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'accept-version': '1.0.0',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Webflow error ${res.status}: ${await res.text()}`);
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
    // Create CMS item
    const itemPayload: any = {
      fields: {
        name: input.title,
        slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        _archived: false,
        _draft: false,
        'body': input.html, // Field key must match collection schema; adjust via config if needed
        'summary': input.excerpt,
        'tags': input.tags || [],
      },
    };

    const item = await this.api(`/collections/${this.config.collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemPayload),
    });

    // Publish item
    await this.api(`/collections/${this.config.collectionId}/items/publish`, {
      method: 'POST',
      body: JSON.stringify({ itemIds: [item._id] }),
    });

    return { externalId: item._id };
  }

  supportsScheduling = false;
  supportsImages = false;
  supportsTags = true;
}






