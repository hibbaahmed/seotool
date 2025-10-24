import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all onboarding keywords for the user
    const { data: keywords, error } = await supabase
      .from('discovered_keywords')
      .select(`
        *,
        keyword_opportunities (
          opportunity_score,
          ranking_potential,
          content_opportunity,
          competition_level,
          priority_level,
          recommended_action,
          estimated_traffic_potential,
          estimated_conversion_potential
        ),
        user_onboarding_profiles (
          business_name,
          website_url,
          industry,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching onboarding keywords:', error);
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }

    // Group keywords by onboarding profile
    const groupedKeywords = keywords.reduce((acc, keyword) => {
      const profileId = keyword.onboarding_profile_id;
      if (!acc[profileId]) {
        acc[profileId] = {
          profile: keyword.user_onboarding_profiles,
          keywords: []
        };
      }
      acc[profileId].keywords.push(keyword);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      data: groupedKeywords
    });

  } catch (error) {
    console.error('Onboarding keywords API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
