/**
 * API Endpoint: Fetch keywords from DataForSEO
 * Manually fetch and classify keywords for a given seed keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchKeywordsFromDataForSEO, saveKeywordsToDatabase } from '@/lib/dataforseo-keywords';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      seedKeyword, 
      locationCode = 2840, // USA
      includeQuestions = true,
      includeRelated = true,
      maxResults = 50,
      saveToDatabase = true,
      projectId 
    } = body;

    if (!seedKeyword) {
      return NextResponse.json({ error: 'seedKeyword is required' }, { status: 400 });
    }

    console.log(`🔍 Fetching DataForSEO keywords for: "${seedKeyword}"`);

    // Fetch keywords from DataForSEO
    const keywordSet = await fetchKeywordsFromDataForSEO(
      seedKeyword,
      locationCode,
      {
        includeQuestions,
        includeRelated,
        maxResults
      }
    );

    // Save to database if requested
    if (saveToDatabase && projectId) {
      await saveKeywordsToDatabase(keywordSet, projectId, user.id);
      console.log('✅ Keywords saved to database');
    }

    // Return formatted response
    return NextResponse.json({
      success: true,
      seedKeyword,
      keywords: {
        primary: keywordSet.primary,
        secondary: keywordSet.secondary,
        longTail: keywordSet.longTail
      },
      counts: {
        primary: keywordSet.primary.length,
        secondary: keywordSet.secondary.length,
        longTail: keywordSet.longTail.length,
        total: keywordSet.all.length
      },
      saved: saveToDatabase && projectId
    });

  } catch (error: any) {
    console.error('❌ Error fetching DataForSEO keywords:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch keywords',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Fetch keywords for a stored keyword ID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keyword_id');

    if (!keywordId) {
      return NextResponse.json({ error: 'keyword_id is required' }, { status: 400 });
    }

    // Fetch the keyword
    const { data: keyword, error: keywordError } = await supabase
      .from('discovered_keywords')
      .select('*')
      .eq('id', keywordId)
      .eq('user_id', user.id)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Check if we already have classified keywords
    const { data: relatedKeywords } = await supabase
      .from('discovered_keywords')
      .select('*')
      .or(`parent_keyword_id.eq.${keywordId},id.eq.${keywordId}`)
      .order('search_volume', { ascending: false });

    if (relatedKeywords && relatedKeywords.length > 1) {
      // Return existing classified keywords
      const primary = relatedKeywords.filter((k: any) => k.keyword_type === 'primary');
      const secondary = relatedKeywords.filter((k: any) => k.keyword_type === 'secondary');
      const longTail = relatedKeywords.filter((k: any) => k.keyword_type === 'long-tail');

      return NextResponse.json({
        success: true,
        seedKeyword: keyword.keyword,
        keywords: {
          primary: primary.map((k: any) => ({
            keyword: k.keyword,
            searchVolume: k.search_volume,
            difficulty: k.difficulty_score,
            cpc: k.cpc
          })),
          secondary: secondary.map((k: any) => ({
            keyword: k.keyword,
            searchVolume: k.search_volume,
            difficulty: k.difficulty_score,
            cpc: k.cpc
          })),
          longTail: longTail.map((k: any) => ({
            keyword: k.keyword,
            searchVolume: k.search_volume,
            difficulty: k.difficulty_score,
            cpc: k.cpc
          }))
        },
        counts: {
          primary: primary.length,
          secondary: secondary.length,
          longTail: longTail.length,
          total: relatedKeywords.length
        },
        cached: true
      });
    }

    // Fetch fresh data from DataForSEO
    console.log(`🔍 Fetching fresh DataForSEO keywords for: "${keyword.keyword}"`);

    const keywordSet = await fetchKeywordsFromDataForSEO(
      keyword.keyword,
      2840,
      {
        includeQuestions: true,
        includeRelated: true,
        maxResults: 50
      }
    );

    // Save to database
    if (keyword.onboarding_profile_id) {
      await saveKeywordsToDatabase(
        keywordSet,
        keyword.onboarding_profile_id,
        user.id
      );
    }

    return NextResponse.json({
      success: true,
      seedKeyword: keyword.keyword,
      keywords: {
        primary: keywordSet.primary,
        secondary: keywordSet.secondary,
        longTail: keywordSet.longTail
      },
      counts: {
        primary: keywordSet.primary.length,
        secondary: keywordSet.secondary.length,
        longTail: keywordSet.longTail.length,
        total: keywordSet.all.length
      },
      cached: false
    });

  } catch (error: any) {
    console.error('❌ Error fetching DataForSEO keywords:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch keywords',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

