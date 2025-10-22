import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { getAdapter } from '@/lib/integrations/getAdapter';

export async function GET() {
  const supabase = supabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integrations: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = supabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { provider, name, config } = body;
  if (!provider || !name || !config) {
    return NextResponse.json({ error: 'provider, name, config required' }, { status: 400 });
  }

  // Optional: test connection before saving
  try {
    const adapter = getAdapter(provider, config);
    const ok = await adapter.testConnection();
    if (!ok) return NextResponse.json({ error: 'Connection test failed' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Connection test failed' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('integrations')
    .insert({ user_id: user.id, provider, name, config } as any)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integration: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = supabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}



