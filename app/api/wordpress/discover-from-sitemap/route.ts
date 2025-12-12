import { NextRequest, NextResponse } from 'next/server';
import { parseSitemapForWordPressUrl } from '@/lib/wordpress/sitemap-parser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sitemapUrl } = body;

    if (!sitemapUrl) {
      return NextResponse.json(
        { error: 'Sitemap URL is required' },
        { status: 400 }
      );
    }

    // Parse the sitemap and extract WordPress site URL
    const result = await parseSitemapForWordPressUrl(sitemapUrl);

    if (!result.isValid) {
      return NextResponse.json(
        { error: result.error || 'Failed to discover WordPress site from sitemap' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      siteUrl: result.siteUrl,
      success: true,
    });
  } catch (error) {
    console.error('Error discovering WordPress site from sitemap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

