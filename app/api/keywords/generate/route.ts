/**
 * API Endpoint: Generate more keywords after onboarding
 * Allows users to discover additional keywords for existing projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchKeywordsFromDataForSEO } from '@/lib/dataforseo-keywords';

const REQUIRED_CREDITS = 1;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      seedKeywords = [],
      profileId,
      locationCode = 2840, // USA
      maxKeywordsPerSeed = 30,
      includeQuestions = true,
      includeRelated = true,
      minSearchVolume = 0,
      maxDifficulty = 100
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    if (!seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json({ 
        error: 'At least one seed keyword is required' 
      }, { status: 400 });
    }

    // Verify the profile belongs to the user
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check credits/trial status
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      return NextResponse.json({ error: 'Could not fetch user credits' }, { status: 500 });
    }

    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscription')
      .select('trial_ends_at')
      .eq('email', user.email)
      .maybeSingle();

    if (subscriptionError) {
      console.warn('⚠️ Failed to fetch subscription data for trial check:', subscriptionError);
    }

    const currentCredits = creditsData.credits || 0;
    const now = new Date();
    const trialEndsAt = subscriptionData?.trial_ends_at ? new Date(subscriptionData.trial_ends_at) : null;
    const isInTrial = !!(trialEndsAt && now < trialEndsAt);

    if (!isInTrial && currentCredits < REQUIRED_CREDITS) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${REQUIRED_CREDITS} credit(s) to generate more keywords. You currently have ${currentCredits} credit(s).` },
        { status: 402 }
      );
    }

    console.log(`🔍 Generating keywords for ${seedKeywords.length} seed keywords`);

    const allNewKeywords: any[] = [];
    const errors: string[] = [];

    // Fetch keywords for each seed
    for (const seedKeyword of seedKeywords) {
      try {
        console.log(`📊 Fetching keywords for: "${seedKeyword}"`);
        
        const keywordSet = await fetchKeywordsFromDataForSEO(
          seedKeyword,
          locationCode,
          {
            includeQuestions,
            includeRelated,
            maxResults: maxKeywordsPerSeed
          }
        );

        // Filter by search volume and difficulty
        const filteredKeywords = keywordSet.all.filter(k => 
          k.searchVolume >= minSearchVolume && 
          k.difficulty <= maxDifficulty
        );

        console.log(`✅ Found ${filteredKeywords.length} keywords for "${seedKeyword}"`);

        // Prepare for database insertion
        const keywordsToInsert = filteredKeywords.map(k => ({
          user_id: user.id,
          onboarding_profile_id: profileId,
          keyword: k.keyword,
          search_volume: k.searchVolume,
          difficulty_score: k.difficulty,
          keyword_type: k.type,
          cpc: k.cpc,
          opportunity_level: calculateOpportunityLevel(k.searchVolume, k.difficulty),
          source: 'dataforseo',
          keyword_intent: determineIntent(k.keyword),
          related_keywords: k.relatedKeywords || [],
          monthly_trends: k.monthlyTrends || [],
          parent_keyword_id: null, // Will be set for secondary/long-tail
          dataforseo_data: {
            searchVolume: k.searchVolume,
            difficulty: k.difficulty,
            cpc: k.cpc,
            type: k.type,
            fetchedAt: new Date().toISOString()
          },
          keyword_data_updated_at: new Date().toISOString()
        }));

        allNewKeywords.push(...keywordsToInsert);

      } catch (error: any) {
        console.error(`❌ Error fetching keywords for "${seedKeyword}":`, error);
        errors.push(`${seedKeyword}: ${error.message}`);
      }
    }

    if (allNewKeywords.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No keywords were generated',
        errors
      }, { status: 400 });
    }

    // Save to database (using insert)
    const { data: savedKeywords, error: saveError } = await supabase
      .from('discovered_keywords')
      .insert(allNewKeywords)
      .select();

    if (saveError) {
      // If it's a duplicate error, some keywords may have been inserted
      // Check if error is about unique violation
      if (saveError.message && saveError.message.includes('duplicate')) {
        console.warn('⚠️ Some keywords already exist in database (duplicates skipped)');
      } else {
        console.error('❌ Error saving keywords:', saveError);
        return NextResponse.json({
          error: 'Failed to save keywords',
          message: saveError.message
        }, { status: 500 });
      }
    }

    console.log(`💾 Saved ${savedKeywords?.length || 0} keywords to database`);

    // Group keywords by type for response
    const primaryKeywords = allNewKeywords.filter(k => k.keyword_type === 'primary');
    const secondaryKeywords = allNewKeywords.filter(k => k.keyword_type === 'secondary');
    const longTailKeywords = allNewKeywords.filter(k => k.keyword_type === 'long-tail');

    // Deduct credits if not in trial
    if (!isInTrial) {
      const { error: deductError } = await supabase
        .from('credits')
        .update({ credits: currentCredits - REQUIRED_CREDITS })
        .eq('user_id', user.id);

      if (deductError) {
        console.error('⚠️ Failed to deduct credits after keyword generation:', deductError);
      } else {
        console.log(`✅ Deducted ${REQUIRED_CREDITS} credit(s) from user ${user.id}. Remaining: ${currentCredits - REQUIRED_CREDITS}`);
      }
    } else {
      console.log('🎉 User is in trial period - skipping credit deduction for keyword generation');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${allNewKeywords.length} keywords`,
      keywords: {
        total: allNewKeywords.length,
        saved: savedKeywords?.length || 0,
        byType: {
          primary: primaryKeywords.length,
          secondary: secondaryKeywords.length,
          longTail: longTailKeywords.length
        },
        byOpportunity: {
          high: allNewKeywords.filter(k => k.opportunity_level === 'high').length,
          medium: allNewKeywords.filter(k => k.opportunity_level === 'medium').length,
          low: allNewKeywords.filter(k => k.opportunity_level === 'low').length
        }
      },
      errors: errors.length > 0 ? errors : undefined,
      samples: {
        primary: primaryKeywords.slice(0, 5).map(k => ({
          keyword: k.keyword,
          searchVolume: k.search_volume,
          difficulty: k.difficulty_score
        })),
        secondary: secondaryKeywords.slice(0, 5).map(k => ({
          keyword: k.keyword,
          searchVolume: k.search_volume,
          difficulty: k.difficulty_score
        })),
        longTail: longTailKeywords.slice(0, 5).map(k => ({
          keyword: k.keyword,
          searchVolume: k.search_volume,
          difficulty: k.difficulty_score
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Error generating keywords:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate keywords',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate opportunity level based on search volume and difficulty
 */
function calculateOpportunityLevel(
  searchVolume: number, 
  difficulty: number
): 'low' | 'medium' | 'high' {
  // High opportunity: Good volume, low difficulty
  if (searchVolume >= 1000 && difficulty <= 40) return 'high';
  if (searchVolume >= 500 && difficulty <= 30) return 'high';
  
  // Medium opportunity: Moderate volume/difficulty balance
  if (searchVolume >= 500 && difficulty <= 60) return 'medium';
  if (searchVolume >= 1000 && difficulty <= 70) return 'medium';
  
  // Low opportunity: Low volume or high difficulty
  return 'low';
}

/**
 * Determine keyword intent based on patterns
 */
function determineIntent(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();
  
  // Transactional
  if (/buy|purchase|order|shop|price|cost|cheap|best|top|review/.test(lowerKeyword)) {
    return 'transactional';
  }
  
  // Commercial investigation
  if (/vs|versus|compare|comparison|alternative|review|best/.test(lowerKeyword)) {
    return 'commercial';
  }
  
  // Navigational
  if (/login|sign in|download|official/.test(lowerKeyword)) {
    return 'navigational';
  }
  
  // Informational (default)
  return 'informational';
}

/**
 * GET endpoint - Get profile info for keyword generation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      // Return all profiles for user
      const { data: profiles, error } = await supabase
        .from('user_onboarding_profiles')
        .select(`
          *,
          discovered_keywords (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        profiles: profiles || [],
        canGenerate: profiles && profiles.length > 0
      });
    }

    // Get specific profile with keyword stats
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get keyword stats
    const { data: keywordStats } = await supabase
      .from('discovered_keywords')
      .select('keyword_type, opportunity_level')
      .eq('onboarding_profile_id', profileId);

    const stats = {
      total: keywordStats?.length || 0,
      byType: {
        primary: keywordStats?.filter(k => k.keyword_type === 'primary').length || 0,
        secondary: keywordStats?.filter(k => k.keyword_type === 'secondary').length || 0,
        longTail: keywordStats?.filter(k => k.keyword_type === 'long-tail').length || 0,
        unclassified: keywordStats?.filter(k => !k.keyword_type).length || 0
      },
      byOpportunity: {
        high: keywordStats?.filter(k => k.opportunity_level === 'high').length || 0,
        medium: keywordStats?.filter(k => k.opportunity_level === 'medium').length || 0,
        low: keywordStats?.filter(k => k.opportunity_level === 'low').length || 0
      }
    };

    return NextResponse.json({
      profile,
      stats,
      canGenerate: true
    });

  } catch (error: any) {
    console.error('❌ Error getting profile info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get profile info',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

