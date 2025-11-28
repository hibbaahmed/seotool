import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, onboarding_profile_id } = body;

    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('wordpress_sites')
      .update({ onboarding_profile_id: onboarding_profile_id || null })
      .eq('id', siteId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating WordPress site mapping:', error);
      return NextResponse.json(
        { error: 'Failed to update WordPress site mapping' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WordPress site mapping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

