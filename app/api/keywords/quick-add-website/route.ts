/**
 * Quick Add Website - Simplified keyword discovery
 * Allows users to add a website and get keywords without full onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      websiteUrl,
      businessName,
      industry
    } = body;

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Extract domain
    let domain: string;
    try {
      const url = new URL(normalizedUrl);
      domain = url.hostname.replace('www.', '');
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
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

    const { data: subscriptionData } = await supabase
      .from('subscription')
      .select('trial_ends_at')
      .eq('email', user.email)
      .maybeSingle();

    const currentCredits = creditsData.credits || 0;
    const now = new Date();
    const trialEndsAt = subscriptionData?.trial_ends_at ? new Date(subscriptionData.trial_ends_at) : null;
    const isInTrial = !!(trialEndsAt && now < trialEndsAt);

    const REQUIRED_CREDITS = 1;
    if (!isInTrial && currentCredits < REQUIRED_CREDITS) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${REQUIRED_CREDITS} credit(s) to analyze a website. You currently have ${currentCredits} credit(s).` },
        { status: 402 }
      );
    }

    // Create onboarding profile (simplified)
    const { data: onboardingProfile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .insert({
        user_id: user.id,
        website_url: normalizedUrl,
        business_name: businessName || domain,
        industry: industry || 'general',
        onboarding_status: 'in_progress',
        analysis_progress: {}
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Extract seed keywords from website (simplified approach)
    // Use domain name and common terms as seed keywords
    const domainParts = domain.split('.').filter(p => p.length > 2);
    const normalizedBrand = normalizeKeyword(domainParts[0] || '');
    const seedKeywords = [
      domainParts[0], // Main domain name
      `${domainParts[0]} ${industry || 'services'}`,
      `best ${domainParts[0]}`,
      `${domainParts[0]} reviews`
    ].filter(Boolean).slice(0, 3);

    // Generate keywords using DataForSEO (similar to manual keyword generation)
    const { fetchKeywordsFromDataForSEO } = await import('@/lib/dataforseo-keywords');
    
    const allKeywords: any[] = [];
    for (const seed of seedKeywords) {
      try {
        const keywordSet = await fetchKeywordsFromDataForSEO(seed, 2840, {
          includeQuestions: true,
          includeRelated: true,
          maxResults: 20 // Fewer keywords for quick add
        });

        const keywordsToInsert = keywordSet.all
          .filter(k => {
            const normalizedKeyword = normalizeKeyword(k.keyword);
            return normalizedKeyword && normalizedKeyword !== normalizedBrand;
          })
          .map(k => ({
            user_id: user.id,
            onboarding_profile_id: onboardingProfile.id,
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
            dataforseo_data: {
              searchVolume: k.searchVolume,
              difficulty: k.difficulty,
              cpc: k.cpc,
              type: k.type,
              fetchedAt: new Date().toISOString()
            },
            keyword_data_updated_at: new Date().toISOString()
          }));

        allKeywords.push(...keywordsToInsert);
      } catch (err) {
        console.warn(`Failed to fetch keywords for seed "${seed}":`, err);
      }
    }

    // Save keywords
    if (allKeywords.length > 0) {
      const { error: insertError } = await supabase
        .from('discovered_keywords')
        .insert(allKeywords);

      if (insertError) {
        console.error('Error saving keywords:', insertError);
      }
    }

    // Deduct credits (if not in trial) - onboarding API doesn't deduct for quick add
    if (!isInTrial) {
      await supabase
        .from('credits')
        .update({ credits: currentCredits - REQUIRED_CREDITS })
        .eq('user_id', user.id);
    }

    // Update status
    await supabase
      .from('user_onboarding_profiles')
      .update({ 
        onboarding_status: 'completed'
      })
      .eq('id', onboardingProfile.id);

    const highCount = allKeywords.filter(k => k.opportunity_level === 'high').length;
    const mediumCount = allKeywords.filter(k => k.opportunity_level === 'medium').length;
    const lowCount = allKeywords.filter(k => k.opportunity_level === 'low').length;

    return NextResponse.json({
      success: true,
      profileId: onboardingProfile.id,
      keywordsGenerated: allKeywords.length,
      breakdown: {
        high: highCount,
        medium: mediumCount,
        low: lowCount
      }
    });

  } catch (error: any) {
    console.error('Quick add website error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website', message: error.message },
      { status: 500 }
    );
  }
}

function calculateOpportunityLevel(searchVolume: number, difficulty: number): 'low' | 'medium' | 'high' {
  if (searchVolume >= 1000 && difficulty <= 40) return 'high';
  if (searchVolume >= 500 && difficulty <= 60) return 'medium';
  return 'low';
}

function determineIntent(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();
  
  if (/buy|purchase|order|shop|price|cost|cheap|best|top|review/.test(lowerKeyword)) {
    return 'transactional';
  }
  
  if (/vs|versus|compare|comparison|alternative|review|best/.test(lowerKeyword)) {
    return 'commercial';
  }
  
  if (/login|sign in|download|official/.test(lowerKeyword)) {
    return 'navigational';
  }
  
  return 'informational';
}

function normalizeKeyword(keyword?: string) {
  if (!keyword) return '';
  return keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
}

