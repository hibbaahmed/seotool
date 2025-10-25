import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function PUT(request: NextRequest) {
  try {
    const secret = request.headers.get('X-Headless-Secret-Key');
    
    if (secret !== process.env.HEADLESS_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const body = await request.json();
    const { tags } = body;

    if (!tags || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags' }, { status: 400 });
    }

    // Revalidate cache for WordPress content
    for (const tag of tags) {
      revalidateTag(tag);
    }

    return NextResponse.json({ 
      revalidated: true, 
      tags,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating cache:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
