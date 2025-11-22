import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WebflowAdapter } from '@/lib/integrations/webflow';

const WEBFLOW_API_BASE = 'https://api.webflow.com';

async function webflowFetch(token: string, path: string) {
  const response = await fetch(`${WEBFLOW_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'accept-version': '1.0.0',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webflow API error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const siteId = body.siteId as string | undefined;
    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    const { data: site, error } = await supabase
      .from('webflow_sites')
      .select('id, token, site_id, collection_id')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (error || !site) {
      return NextResponse.json({ error: 'Webflow connection not found' }, { status: 404 });
    }

    const adapter = new WebflowAdapter({
      token: site.token,
      siteId: site.site_id,
      collectionId: site.collection_id,
    });

    const ok = await adapter.testConnection();
    if (!ok) {
      return NextResponse.json({ error: 'Unable to reach Webflow site' }, { status: 400 });
    }

    await webflowFetch(site.token, `/collections/${site.collection_id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webflow test endpoint error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

