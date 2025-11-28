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
      industry,
      seedKeywords = [],
      maxKeywordsPerSeed = 30,
      includeQuestions = true,
      includeRelated = true,
      minSearchVolume = 0,
      maxDifficulty = 100,
      locationCode = 2840 // USA
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

    // Use provided seed keywords or generate defaults from domain
    let finalSeedKeywords = seedKeywords;
    if (!finalSeedKeywords || finalSeedKeywords.length === 0) {
      const domainParts = domain.split('.').filter(p => p.length > 2);
      finalSeedKeywords = [
        domainParts[0], // Main domain name
        `${domainParts[0]} ${industry || 'services'}`,
        `best ${domainParts[0]}`,
        `${domainParts[0]} reviews`
      ].filter(Boolean);
    }

    const normalizedBrand = normalizeKeyword(finalSeedKeywords[0] || '');

    // Generate keywords using DataForSEO (same logic as generate endpoint)
    const { fetchKeywordsFromDataForSEO } = await import('@/lib/dataforseo-keywords');
    
    const allKeywords: any[] = [];
    const errors: string[] = [];

    console.log(`🔍 Generating keywords for ${finalSeedKeywords.length} seed keywords`);

    for (const seed of finalSeedKeywords) {
      try {
        console.log(`📊 Fetching keywords for: "${seed}"`);
        
        const keywordSet = await fetchKeywordsFromDataForSEO(seed, locationCode, {
          includeQuestions,
          includeRelated,
          maxResults: maxKeywordsPerSeed
        });

        // Filter by search volume and difficulty
        const filteredKeywords = keywordSet.all.filter(k => 
          k.searchVolume >= minSearchVolume && 
          k.difficulty <= maxDifficulty
        );

        // Filter out brand name matches
        const keywordsToInsert = filteredKeywords
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
            parent_keyword_id: null,
            dataforseo_data: {
              searchVolume: k.searchVolume,
              difficulty: k.difficulty,
              cpc: k.cpc,
              type: k.type,
              fetchedAt: new Date().toISOString()
            },
            keyword_data_updated_at: new Date().toISOString()
          }));

        console.log(`✅ Found ${keywordsToInsert.length} keywords for "${seed}"`);
        allKeywords.push(...keywordsToInsert);
      } catch (err: any) {
        console.error(`❌ Error fetching keywords for "${seed}":`, err);
        errors.push(`${seed}: ${err.message}`);
      }
    }

    // Save keywords
    if (allKeywords.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No keywords were generated',
        errors: errors.length > 0 ? errors : undefined
      }, { status: 400 });
    }

    const { data: savedKeywords, error: insertError } = await supabase
      .from('discovered_keywords')
      .insert(allKeywords)
      .select();

    if (insertError) {
      // If it's a duplicate error, some keywords may have been inserted
      if (insertError.message && insertError.message.includes('duplicate')) {
        console.warn('⚠️ Some keywords already exist in database (duplicates skipped)');
      } else {
        console.error('❌ Error saving keywords:', insertError);
        return NextResponse.json({ 
          error: 'Failed to save keywords',
          message: insertError.message 
        }, { status: 500 });
      }
    }

    console.log(`💾 Saved ${savedKeywords?.length || 0} keywords to database`);

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

    // Group keywords by type for response
    const primaryKeywords = allKeywords.filter(k => k.keyword_type === 'primary');
    const secondaryKeywords = allKeywords.filter(k => k.keyword_type === 'secondary');
    const longTailKeywords = allKeywords.filter(k => k.keyword_type === 'long-tail');

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${allKeywords.length} keywords`,
      profileId: onboardingProfile.id,
      keywords: {
        total: allKeywords.length,
        saved: savedKeywords?.length || 0,
        byType: {
          primary: primaryKeywords.length,
          secondary: secondaryKeywords.length,
          longTail: longTailKeywords.length
        },
        byOpportunity: {
          high: allKeywords.filter(k => k.opportunity_level === 'high').length,
          medium: allKeywords.filter(k => k.opportunity_level === 'medium').length,
          low: allKeywords.filter(k => k.opportunity_level === 'low').length
        }
      },
      keywordsGenerated: allKeywords.length, // Keep for backward compatibility
      breakdown: {
        high: allKeywords.filter(k => k.opportunity_level === 'high').length,
        medium: allKeywords.filter(k => k.opportunity_level === 'medium').length,
        low: allKeywords.filter(k => k.opportunity_level === 'low').length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Quick add website error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website', message: error.message },
      { status: 500 }
    );
  }
}

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

