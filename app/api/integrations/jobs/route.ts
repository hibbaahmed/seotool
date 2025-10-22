import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase/browser';

export async function POST(req: NextRequest) {
  const supabase = supabaseBrowser();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { integrationId, payload, runAt } = body;
    if (!integrationId || !payload) {
      return NextResponse.json({ error: 'integrationId and payload required' }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from('publishing_jobs')
      .insert({
        user_id: user.id,
        integration_id: integrationId,
        payload,
        run_at: runAt || new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: (error as any)?.message || 'Failed to create job' }, { status: 500 });
  }
}



