import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const upstream = await fetch(url, {
      // Some hosts block non-browser UAs or hotlinking; send a common UA
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Referer: new URL(url).origin,
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/*';
    return new Response(upstream.body, {
      headers: {
        'Content-Type': contentType,
        // Cache for a day at the edge/CDN; customize as needed
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


