import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAdapter } from '@/lib/integrations/wordpress';
import { WebhookAdapter } from '@/lib/integrations/webhook';

function getAdapter(provider: string, config: any) {
  switch (provider) {
    case 'wordpress':
      return new WordPressAdapter({
        url: config.url,
        username: config.username,
        password: config.password,
        postType: config.postType,
      });
    case 'webhook':
      return new WebhookAdapter({ url: config.url, secret: config.secret, headers: config.headers });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // fetch due jobs for this user
    const { data: jobs, error: jobsError } = await supabase
      .from('publishing_jobs')
      .select('id, integration_id, payload, attempts')
      .eq('user_id', user.id)
      .eq('status', 'queued')
      .lte('run_at', new Date().toISOString())
      .limit(5);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) return NextResponse.json({ ok: true, processed: 0 });

    let processed = 0;
    for (const job of jobs) {
      try {
        // mark running
        await supabase.from('publishing_jobs').update({ status: 'running' }).eq('id', job.id);

        // load integration
        const { data: integration, error: intErr } = await supabase
          .from('integrations')
          .select('*')
          .eq('id', job.integration_id)
          .eq('user_id', user.id)
          .single();
        if (intErr || !integration) throw intErr || new Error('Integration not found');

        const adapter = getAdapter(integration.provider, integration.config || {});
        const result = await adapter.publish(job.payload);

        await supabase
          .from('publishing_jobs')
          .update({ status: 'succeeded', external_id: result.externalId })
          .eq('id', job.id);
        processed++;
      } catch (e: any) {
        const attempts = (job.attempts || 0) + 1;
        const backoffMinutes = Math.min(60, Math.pow(2, attempts));
        await supabase
          .from('publishing_jobs')
          .update({
            status: 'queued',
            attempts,
            run_at: new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString(),
            last_error: e?.message || 'Unknown error',
          })
          .eq('id', job.id);
      }
    }

    return NextResponse.json({ ok: true, processed });
  } catch (error) {
    return NextResponse.json({ error: (error as any)?.message || 'Dispatch failed' }, { status: 500 });
  }
}