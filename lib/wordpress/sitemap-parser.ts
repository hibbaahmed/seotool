/**
 * Utility functions for parsing WordPress sitemaps and extracting site information
 */

export interface SitemapParseResult {
  siteUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a sitemap XML and extract the WordPress site URL
 * @param sitemapUrl The URL of the sitemap XML file
 * @returns The base WordPress site URL extracted from the sitemap
 */
export async function parseSitemapForWordPressUrl(sitemapUrl: string): Promise<SitemapParseResult> {
  try {
    // Normalize the sitemap URL
    const normalizedUrl = sitemapUrl.trim();
    if (!normalizedUrl) {
      return {
        siteUrl: '',
        isValid: false,
        error: 'Sitemap URL is required',
      };
    }

    // Ensure the URL is valid
    let url: URL;
    try {
      url = new URL(normalizedUrl);
    } catch {
      return {
        siteUrl: '',
        isValid: false,
        error: 'Invalid sitemap URL format',
      };
    }

    // Fetch the sitemap
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Bridgely-SEO-Tool/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return {
        siteUrl: '',
        isValid: false,
        error: `Failed to fetch sitemap: ${response.status} ${response.statusText}`,
      };
    }

    const xmlText = await response.text();

    // Parse the XML to extract URLs
    const urls = extractUrlsFromSitemap(xmlText);

    if (urls.length === 0) {
      return {
        siteUrl: '',
        isValid: false,
        error: 'No URLs found in sitemap',
      };
    }

    // Extract the base URL from the first URL in the sitemap
    // WordPress sitemaps typically contain post URLs like:
    // https://example.com/2024/01/01/post-slug/
    // or https://example.com/post-slug/
    const firstUrl = urls[0];
    try {
      const firstUrlObj = new URL(firstUrl);
      const baseUrl = `${firstUrlObj.protocol}//${firstUrlObj.host}`;

      // Verify it's a WordPress site by checking for common WordPress paths
      const isWordPress = await verifyWordPressSite(baseUrl);

      if (!isWordPress) {
        return {
          siteUrl: baseUrl,
          isValid: false,
          error: 'The site does not appear to be a WordPress site',
        };
      }

      return {
        siteUrl: baseUrl,
        isValid: true,
      };
    } catch (error) {
      return {
        siteUrl: '',
        isValid: false,
        error: `Failed to parse URL from sitemap: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  } catch (error) {
    return {
      siteUrl: '',
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract URLs from sitemap XML
 * Handles both standard sitemap format and sitemap index format
 */
function extractUrlsFromSitemap(xmlText: string): string[] {
  const urls: string[] = [];

  // Handle sitemap index (contains references to other sitemaps)
  const sitemapIndexMatch = xmlText.match(/<sitemapindex[^>]*>/i);
  if (sitemapIndexMatch) {
    // Extract sitemap locations from index
    const sitemapLocRegex = /<loc>(.*?)<\/loc>/gi;
    let match;
    while ((match = sitemapLocRegex.exec(xmlText)) !== null) {
      urls.push(match[1].trim());
    }
    return urls;
  }

  // Handle regular sitemap (contains URLs)
  const urlRegex = /<url[^>]*>[\s\S]*?<\/url>/gi;
  const urlMatches = xmlText.match(urlRegex) || [];

  for (const urlBlock of urlMatches) {
    const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/i);
    if (locMatch) {
      urls.push(locMatch[1].trim());
    }
  }

  return urls;
}

/**
 * Verify that a URL is a WordPress site by checking for WordPress indicators
 */
async function verifyWordPressSite(siteUrl: string): Promise<boolean> {
  try {
    // Check for WordPress REST API endpoint
    const wpJsonUrl = `${siteUrl}/wp-json/wp/v2`;
    const response = await fetch(wpJsonUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Bridgely-SEO-Tool/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    // If wp-json endpoint exists, it's likely WordPress
    if (response.ok || response.status === 401) {
      // 401 is OK - it means the endpoint exists but requires auth
      return true;
    }

    // Fallback: check for common WordPress files/paths
    const wpLoginUrl = `${siteUrl}/wp-login.php`;
    const loginResponse = await fetch(wpLoginUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Bridgely-SEO-Tool/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    // If wp-login.php exists, it's likely WordPress
    return loginResponse.ok || loginResponse.status === 403;
  } catch {
    // If we can't verify, assume it's valid (don't block the connection)
    return true;
  }
}

