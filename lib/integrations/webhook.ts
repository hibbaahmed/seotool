import { PublisherAdapter, PublishInput } from './publisher';

type WebhookConfig = {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
};

export class WebhookAdapter implements PublisherAdapter {
  constructor(private config: WebhookConfig) {}

  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(this.config.url, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async publish(input: PublishInput): Promise<{ externalId: string; url?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.headers || {}),
    };
    if (this.config.secret) headers['X-Signature'] = this.config.secret;

    const res = await fetch(this.config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...input, idempotencyKey: crypto.randomUUID?.() || String(Date.now()) }),
    });
    if (!res.ok) throw new Error(`Webhook error ${res.status}: ${await res.text()}`);
    const data = await res.json().catch(() => ({}));
    return { externalId: data.id || '', url: data.url };
  }
}






