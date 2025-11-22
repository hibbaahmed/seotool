import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WebflowAdapter } from '@/lib/integrations/webflow';

const WEBFLOW_API_BASE = 'https://api.webflow.com';

async function webflowFetch<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${WEBFLOW_API_BASE}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'accept-version': '1.0.0',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webflow API error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('webflow_sites')
      .select(
        'id, name, site_id, site_name, site_slug, domain, collection_id, collection_name, is_active, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Webflow sites:', error);
      return NextResponse.json({ error: 'Failed to fetch Webflow connections' }, { status: 500 });
    }

    return NextResponse.json({ sites: data || [] });
  } catch (err) {
    console.error('Webflow sites GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    const name: string = (body.name || '').trim();
    const token: string = (body.token || '').trim();
    const siteId: string = (body.siteId || '').trim();
    const collectionId: string = (body.collectionId || '').trim();

    if (!token || !siteId || !collectionId) {
      return NextResponse.json(
        { error: 'Missing required fields: token, siteId, collectionId' },
        { status: 400 },
      );
    }

    const { data: existing } = await supabase
      .from('webflow_sites')
      .select('id')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .eq('collection_id', collectionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'This Webflow site and collection are already connected.' },
        { status: 409 },
      );
    }

    const adapter = new WebflowAdapter({ token, siteId, collectionId });
    const connectionOk = await adapter.testConnection();
    if (!connectionOk) {
      return NextResponse.json({ error: 'Unable to reach the Webflow API with the provided credentials.' }, { status: 400 });
    }

    type SiteResponse = {
      name?: string;
      shortName?: string;
      defaultDomain?: string | { name?: string };
      customDomains?: (string | { name?: string })[];
      publishedDomains?: (string | { name?: string })[];
    };

    type CollectionResponse = {
      name?: string;
      slug?: string;
    };

    const [siteDetails, collectionDetails] = await Promise.all([
      webflowFetch<SiteResponse>(token, `/sites/${siteId}`),
      webflowFetch<CollectionResponse>(token, `/collections/${collectionId}`),
    ]);

    const extractDomain = (value: string | { name?: string } | undefined | null) => {
      if (!value) return null;
      if (typeof value === 'string') return value;
      return value.name || null;
    };

    const domain =
      extractDomain(siteDetails?.publishedDomains?.[0]) ||
      extractDomain(siteDetails?.customDomains?.[0]) ||
      extractDomain(siteDetails?.defaultDomain) ||
      null;

    const friendlyName = name || collectionDetails?.name || siteDetails?.name || 'Webflow Collection';

    const { data, error } = await supabase
      .from('webflow_sites')
      .insert({
        user_id: user.id,
        name: friendlyName,
        token,
        site_id: siteId,
        site_name: siteDetails?.name || null,
        site_slug: siteDetails?.shortName || null,
        domain,
        collection_id: collectionId,
        collection_name: collectionDetails?.name || null,
        is_active: true,
      } as any)
      .select(
        'id, name, site_id, site_name, site_slug, domain, collection_id, collection_name, is_active, created_at, updated_at',
      )
      .single();

    if (error) {
      console.error('Error saving Webflow site:', error);
      return NextResponse.json({ error: 'Failed to save Webflow site' }, { status: 500 });
    }

    return NextResponse.json({ site: data });
  } catch (err) {
    console.error('Webflow sites POST error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('webflow_sites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting Webflow site:', error);
      return NextResponse.json({ error: 'Failed to delete Webflow site' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webflow sites DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

