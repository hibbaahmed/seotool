/**
 * Manual Keyword Entry - Add keywords directly to a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { fetchKeywordsFromDataForSEO } from '@/lib/dataforseo-keywords';

/**
 * Fetch search volume and metrics for a single keyword directly from DataForSEO
 */
async function fetchKeywordMetrics(keyword: string, locationCode: number = 2840): Promise<{
  searchVolume: number;
  difficulty: number;
  cpc: number;
} | null> {
  try {
    const baseUrl = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com/v3';
    let auth = process.env.DATA_FOR_SEO_KEY || '';
    
    if (auth.includes(':')) {
      auth = Buffer.from(auth, 'utf-8').toString('base64');
    }

    const payload = [{
      location_code: locationCode,
      keywords: [keyword],
      search_partners: true
    }];

    const res = await fetch(`${baseUrl}/keywords_data/google_ads/search_volume/live`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    
    if (Array.isArray(data?.tasks)) {
      for (const task of data.tasks) {
        if (task.status_code === 20000 && Array.isArray(task.result)) {
          for (const result of task.result) {
            if (result.keyword && result.keyword.toLowerCase() === keyword.toLowerCase()) {
              return {
                searchVolume: Number(result.search_volume || 0),
                difficulty: Number(result.competition_index || result.keyword_difficulty || 0),
                cpc: Number(result.cpc || 0)
              };
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Failed to fetch metrics for "${keyword}":`, error);
    return null;
  }
}

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
    const allDiscoveredKeywords = new Set<string>(); // Track all keywords to avoid duplicates

    // Process each keyword
    for (const keywordText of keywords) {
      const trimmed = keywordText.trim();
      if (!trimmed) continue;

      // Optionally enrich with DataForSEO and fetch related keywords
      if (enrichWithDataForSEO) {
        try {
          console.log(`🔍 Fetching keywords from DataForSEO for: "${trimmed}"`);
          
          // First, try to get search volume for the seed keyword directly
          const seedKeywordMetrics = await fetchKeywordMetrics(trimmed, 2840);

          // Fetch comprehensive keyword data including related keywords, questions, and suggestions
          const keywordSet = await fetchKeywordsFromDataForSEO(trimmed, 2840, {
            includeQuestions: true,
            includeRelated: true,
            maxResults: 30 // Get up to 30 related keywords per seed
          });

          console.log(`✅ Retrieved ${keywordSet.all.length} keywords from DataForSEO`);

          // Ensure the seed keyword is always included, even if it has 0 volume
          const seedKeywordLower = trimmed.toLowerCase();
          let seedKeywordIncluded = false;

          // Process all discovered keywords (including the seed and related ones)
          for (const kw of keywordSet.all) {
            const keywordLower = kw.keyword.toLowerCase();
            
            // Track if seed keyword is in the results
            if (keywordLower === seedKeywordLower) {
              seedKeywordIncluded = true;
            }
            
            // Skip if we've already processed this keyword
            if (allDiscoveredKeywords.has(keywordLower)) continue;
            allDiscoveredKeywords.add(keywordLower);

            // Use seed keyword metrics if available and this is the seed keyword
            let searchVolume = kw.searchVolume;
            let difficulty = kw.difficulty;
            let cpc = kw.cpc;

            if (keywordLower === seedKeywordLower && seedKeywordMetrics) {
              searchVolume = seedKeywordMetrics.searchVolume;
              difficulty = seedKeywordMetrics.difficulty;
              cpc = seedKeywordMetrics.cpc;
            }

            // Calculate opportunity level
            let opportunityLevel: 'low' | 'medium' | 'high' = 'medium';
            if (searchVolume >= 1000 && difficulty < 40) {
              opportunityLevel = 'high';
            } else if (searchVolume >= 500 && difficulty < 70) {
              opportunityLevel = 'medium';
            } else {
              opportunityLevel = 'low';
            }

            keywordsToInsert.push({
              user_id: user.id,
              onboarding_profile_id: profileId,
              keyword: kw.keyword,
              search_volume: searchVolume,
              difficulty_score: difficulty,
              cpc: cpc,
              opportunity_level: opportunityLevel,
              keyword_type: kw.type, // Use classification from DataForSEO
              source: 'dataforseo',
              keyword_intent: determineIntent(kw.keyword),
              related_keywords: kw.relatedKeywords || [],
              monthly_trends: kw.monthlyTrends || [],
              dataforseo_data: {
                searchVolume: searchVolume,
                difficulty: difficulty,
                cpc: cpc,
                type: kw.type,
                fetchedAt: new Date().toISOString()
              },
              keyword_data_updated_at: new Date().toISOString()
            });
          }

          // If seed keyword wasn't included (filtered out due to 0 volume), add it manually
          if (!seedKeywordIncluded && !allDiscoveredKeywords.has(seedKeywordLower)) {
            allDiscoveredKeywords.add(seedKeywordLower);
            
            const searchVolume = seedKeywordMetrics?.searchVolume || 0;
            const difficulty = seedKeywordMetrics?.difficulty || 50;
            const cpc = seedKeywordMetrics?.cpc || 0;
            const keywordType = classifyKeywordType(trimmed, searchVolume);

            let opportunityLevel: 'low' | 'medium' | 'high' = 'medium';
            if (searchVolume >= 1000 && difficulty < 40) {
              opportunityLevel = 'high';
            } else if (searchVolume >= 500 && difficulty < 70) {
              opportunityLevel = 'medium';
            } else {
              opportunityLevel = 'low';
            }

            keywordsToInsert.push({
              user_id: user.id,
              onboarding_profile_id: profileId,
              keyword: trimmed,
              search_volume: searchVolume,
              difficulty_score: difficulty,
              cpc: cpc,
              opportunity_level: opportunityLevel,
              keyword_type: keywordType,
              source: 'dataforseo',
              keyword_intent: determineIntent(trimmed),
              related_keywords: [],
              dataforseo_data: seedKeywordMetrics ? {
                searchVolume: searchVolume,
                difficulty: difficulty,
                cpc: cpc,
                type: keywordType,
                fetchedAt: new Date().toISOString()
              } : null,
              keyword_data_updated_at: new Date().toISOString()
            });
          }

        } catch (err) {
          console.warn(`Failed to enrich keyword "${trimmed}":`, err);
          // Fall back to adding just the manually entered keyword
          if (!allDiscoveredKeywords.has(trimmed.toLowerCase())) {
            allDiscoveredKeywords.add(trimmed.toLowerCase());
            
            const keywordType = classifyKeywordType(trimmed, 0);
            keywordsToInsert.push({
              user_id: user.id,
              onboarding_profile_id: profileId,
              keyword: trimmed,
              search_volume: 0,
              difficulty_score: 50,
              cpc: 0,
              opportunity_level: 'medium',
              keyword_type: keywordType,
              source: 'manual',
              keyword_intent: determineIntent(trimmed),
              related_keywords: [],
              keyword_data_updated_at: new Date().toISOString()
            });
          }
        }
      } else {
        // No enrichment - just add the manually entered keyword
        if (!allDiscoveredKeywords.has(trimmed.toLowerCase())) {
          allDiscoveredKeywords.add(trimmed.toLowerCase());
          
          const keywordType = classifyKeywordType(trimmed, 0);
          keywordsToInsert.push({
            user_id: user.id,
            onboarding_profile_id: profileId,
            keyword: trimmed,
            search_volume: 0,
            difficulty_score: 50,
            cpc: 0,
            opportunity_level: 'medium',
            keyword_type: keywordType,
            source: 'manual',
            keyword_intent: determineIntent(trimmed),
            related_keywords: [],
            keyword_data_updated_at: new Date().toISOString()
          });
        }
      }
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

    // Calculate summary statistics
    const primaryCount = insertedKeywords?.filter((k: any) => k.keyword_type === 'primary').length || 0;
    const secondaryCount = insertedKeywords?.filter((k: any) => k.keyword_type === 'secondary').length || 0;
    const longTailCount = insertedKeywords?.filter((k: any) => k.keyword_type === 'long-tail').length || 0;

    console.log(`📈 Classified keywords:
  Primary: ${primaryCount}
  Secondary: ${secondaryCount}
  Long-tail: ${longTailCount}`);

    return NextResponse.json({
      success: true,
      added: insertedKeywords?.length || 0,
      keywords: insertedKeywords,
      summary: {
        total: insertedKeywords?.length || 0,
        primary: primaryCount,
        secondary: secondaryCount,
        longTail: longTailCount,
        enriched: enrichWithDataForSEO
      }
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

/**
 * Classify keyword type for manual entries
 * Based on word count and search volume characteristics
 */
function classifyKeywordType(
  keyword: string,
  searchVolume: number
): 'primary' | 'secondary' | 'long-tail' {
  const wordCount = keyword.split(' ').length;
  
  // Long-tail: 4+ words OR low volume with 3+ words
  if (wordCount >= 4 || (searchVolume < 500 && wordCount >= 3)) {
    return 'long-tail';
  }
  
  // Primary: 1-2 words with decent volume, or high-volume 3-word keywords
  if (wordCount <= 2) {
    return 'primary';
  }
  
  // Secondary: 3 words with good volume (500+)
  if (wordCount === 3 && searchVolume >= 500) {
    return 'secondary';
  }
  
  // Default based on volume
  if (searchVolume >= 500) {
    return 'secondary';
  }
  
  return 'long-tail';
}

