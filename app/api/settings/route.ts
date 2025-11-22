import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('content_length, auto_promote_business, created_at, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // If no settings exist, return default
    if (!settings) {
      return NextResponse.json({
        content_length: 'long',
        auto_promote_business: false,
        created_at: null,
        updated_at: null
      });
    }

    return NextResponse.json({
      content_length: settings.content_length || 'long',
      auto_promote_business: settings.auto_promote_business ?? false,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    });
  } catch (error) {
    console.error('Settings GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content_length, auto_promote_business } = body;

    if (content_length && !['short', 'medium', 'long'].includes(content_length)) {
      return NextResponse.json(
        { error: 'Invalid content_length. Must be "short", "medium", or "long"' },
        { status: 400 }
      );
    }

    if (
      auto_promote_business !== undefined &&
      typeof auto_promote_business !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid auto_promote_business. Must be a boolean value.' },
        { status: 400 }
      );
    }

    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('content_length, auto_promote_business')
      .eq('user_id', user.id)
      .maybeSingle();

    const nextContentLength =
      content_length || existingSettings?.content_length || 'long';

    const nextAutoPromote =
      typeof auto_promote_business === 'boolean'
        ? auto_promote_business
        : existingSettings?.auto_promote_business ?? false;

    // Upsert settings (insert if doesn't exist, update if it does)
    const { data: settings, error: upsertError } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          content_length: nextContentLength,
          auto_promote_business: nextAutoPromote,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id'
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating user settings:', upsertError);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({
      content_length: settings.content_length,
      auto_promote_business: settings.auto_promote_business ?? false,
      created_at: settings.created_at,
      updated_at: settings.updated_at
    });
  } catch (error) {
    console.error('Settings PATCH API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

