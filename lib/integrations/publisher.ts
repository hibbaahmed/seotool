export type PublishInput = {
  title: string;
  html: string;
  excerpt?: string;
  tags?: string[];
  imageUrl?: string;
  slug?: string;
  metadata?: Record<string, any>;
  when?: string; // ISO publish date
};

export interface PublisherAdapter {
  testConnection(): Promise<boolean>;
  publish(input: PublishInput): Promise<{ externalId: string; url?: string }>;
  supportsScheduling?: boolean;
  supportsImages?: boolean;
  supportsTags?: boolean;
}



