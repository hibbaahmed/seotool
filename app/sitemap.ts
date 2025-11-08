import { MetadataRoute } from 'next';

// Revalidate sitemap every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_URL || 'https://bridgely.io';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/content-writer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/seo-research`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Try to fetch WordPress posts for sitemap
  // This will work at runtime when the sitemap is requested (ISR)
  try {
    // Use internal API route (relative URL works in Next.js)
    // During build, this will fail gracefully and return static pages only
    const response = await fetch(`${baseUrl}/api/wordpress/posts?limit=100`, {
      next: { revalidate: 3600 }, // Revalidate every hour (ISR)
    });
    
    if (response.ok) {
      const data = await response.json();
      const posts = data.posts || [];
      
      if (posts.length > 0) {
        // Dynamic blog posts
        const blogPages: MetadataRoute.Sitemap = posts.map((post: any) => ({
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post.modified || post.date ? new Date(post.modified || post.date) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        }));

        return [...staticPages, ...blogPages];
      }
    }
  } catch (error) {
    // Silently fail during build - static pages will be included
    // At runtime, the sitemap will be regenerated with WordPress posts
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Could not fetch WordPress posts for sitemap (this is normal during build):', error);
    }
  }
  
  // Return static pages only (during build or if fetch fails)
  return staticPages;
}
