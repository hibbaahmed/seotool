import { WordPressAdapter } from './wordpress';
import { WebflowAdapter } from './webflow';
import { NotionAdapter } from './notion';
import { ShopifyAdapter } from './shopify';
import { WixAdapter } from './wix';
import { WPComAdapter } from './wpcom';
import { FramerAdapter } from './framer';
import { WebhookAdapter } from './webhook';

export function getAdapter(provider: string, config: any) {
  switch (provider) {
    case 'wordpress':
      return new WordPressAdapter({
        url: config.url,
        username: config.username,
        password: config.password,
        postType: config.postType,
      });
    case 'wpcom':
      return new WPComAdapter({ accessToken: config.accessToken, siteId: config.siteId });
    case 'webflow':
      return new WebflowAdapter({ token: config.token, siteId: config.siteId, collectionId: config.collectionId });
    case 'notion':
      return new NotionAdapter({ token: config.token, databaseId: config.databaseId });
    case 'shopify':
      return new ShopifyAdapter({ storeDomain: config.storeDomain, accessToken: config.accessToken, blogId: Number(config.blogId), apiVersion: config.apiVersion });
    case 'wix':
      return new WixAdapter({ accessToken: config.accessToken, blogId: config.blogId });
    case 'framer':
      return new FramerAdapter({ token: config.token, projectId: config.projectId, collectionId: config.collectionId });
    case 'webhook':
      return new WebhookAdapter({ url: config.url, secret: config.secret, headers: config.headers });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}






