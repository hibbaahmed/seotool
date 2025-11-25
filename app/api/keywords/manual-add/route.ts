/**
 * Manual Keyword Entry - Add keywords directly to a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchKeywordsFromDataForSEO } from '@/lib/dataforseo-keywords';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      profileId,
      keywords, // Array of keyword strings
      enrichWithDataForSEO = false // Optionally fetch metrics
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 });
    }

    // Verify profile belongs to user
    const { data: profile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const keywordsToInsert: any[] = [];

    // Process each keyword
    for (const keywordText of keywords) {
      const trimmed = keywordText.trim();
      if (!trimmed) continue;

      let searchVolume = 0;
      let difficulty = 50;
      let cpc = 0;
      let opportunityLevel: 'low' | 'medium' | 'high' = 'medium';

      // Optionally enrich with DataForSEO
      if (enrichWithDataForSEO) {
        try {
          const keywordSet = await fetchKeywordsFromDataForSEO(trimmed, 2840, {
            includeQuestions: false,
            includeRelated: false,
            maxResults: 1
          });

          if (keywordSet.all.length > 0) {
            const kw = keywordSet.all[0];
            searchVolume = kw.searchVolume;
            difficulty = kw.difficulty;
            cpc = kw.cpc;
            
            // Calculate opportunity level
            if (searchVolume >= 1000 && difficulty < 40) {
              opportunityLevel = 'high';
            } else if (searchVolume >= 500 && difficulty < 70) {
              opportunityLevel = 'medium';
            } else {
              opportunityLevel = 'low';
            }
          }
        } catch (err) {
          console.warn(`Failed to enrich keyword "${trimmed}":`, err);
          // Continue with default values
        }
      }

      keywordsToInsert.push({
        user_id: user.id,
        onboarding_profile_id: profileId,
        keyword: trimmed,
        search_volume: searchVolume,
        difficulty_score: difficulty,
        cpc: cpc,
        opportunity_level: opportunityLevel,
        source: enrichWithDataForSEO ? 'dataforseo' : 'manual',
        keyword_intent: determineIntent(trimmed),
        related_keywords: [],
        keyword_data_updated_at: new Date().toISOString()
      });
    }

    if (keywordsToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid keywords to add' }, { status: 400 });
    }

    // Insert keywords
    const { data: insertedKeywords, error: insertError } = await supabase
      .from('discovered_keywords')
      .insert(keywordsToInsert)
      .select();

    if (insertError) {
      // Handle duplicates gracefully
      if (insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
        console.warn('Some keywords already exist (duplicates skipped)');
        // Try to get the count of successfully inserted
        const { count } = await supabase
          .from('discovered_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_profile_id', profileId);
        
        return NextResponse.json({
          success: true,
          message: 'Some keywords were already in the database',
          added: keywordsToInsert.length,
          skipped: keywords.length - keywordsToInsert.length
        });
      }
      
      console.error('Error inserting keywords:', insertError);
      return NextResponse.json({ error: 'Failed to add keywords' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added: insertedKeywords?.length || 0,
      keywords: insertedKeywords
    });

  } catch (error: any) {
    console.error('Manual add keywords error:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords', message: error.message },
      { status: 500 }
    );
  }
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

