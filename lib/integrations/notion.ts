import { PublisherAdapter, PublishInput } from './publisher';

type NotionConfig = {
  token: string;
  databaseId: string;
};

export class NotionAdapter implements PublisherAdapter {
  constructor(private config: NotionConfig) {}

  private async api(path: string, init: RequestInit) {
    const res = await fetch(`https://api.notion.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Notion error ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api(`/databases/${this.config.databaseId}`, { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const page = await this.api(`/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: this.config.databaseId },
        properties: {
          Name: {
            title: [{ text: { content: input.title } }],
          },
          Tags: input.tags ? { multi_select: input.tags.map(t => ({ name: t })) } : undefined,
        },
        children: [
          { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ text: { content: input.title } }] } },
          { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: input.excerpt || '' } }] } },
          { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: input.html.replace(/<[^>]+>/g, '') } }] } },
        ],
      }),
    });
    return { externalId: page.id };
  }

  supportsScheduling = false;
  supportsImages = false;
  supportsTags = true;
}






