/**
 * DataForSEO Keyword Research Integration
 * Fetches primary, secondary, and long-tail keywords with real metrics
 */

interface DataForSEOKeyword {
  keyword: string;
  search_volume: number;
  competition: number;
  competition_index: number;
  cpc: number;
  keyword_difficulty: number;
  keyword_info?: {
    monthly_searches: Array<{ month: number; year: number; search_volume: number }>;
  };
}

export interface EnrichedKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  type: 'primary' | 'secondary' | 'long-tail';
  monthlyTrends?: Array<{ month: string; volume: number }>;
  relatedKeywords?: string[];
}

export interface KeywordSet {
  primary: EnrichedKeyword[];
  secondary: EnrichedKeyword[];
  longTail: EnrichedKeyword[];
  all: EnrichedKeyword[];
}

/**
 * DataForSEO API client
 */
async function dataForSeoPost(path: string, payload: any): Promise<any> {
  const baseUrl = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com/v3';
  let auth = process.env.DATA_FOR_SEO_KEY || '';
  
  // Encode credentials if needed
  if (auth.includes(':')) {
    auth = Buffer.from(auth, 'utf-8').toString('base64');
  }
  
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO error ${res.status}: ${text}`);
  }
  
  return await res.json();
}

/**
 * Classify keyword as primary, secondary, or long-tail based on characteristics
 */
function classifyKeyword(
  keyword: string,
  searchVolume: number,
  difficulty: number,
  seedKeyword: string
): 'primary' | 'secondary' | 'long-tail' {
  const wordCount = keyword.split(' ').length;
  const seedWords = seedKeyword.toLowerCase().split(' ');
  const keywordLower = keyword.toLowerCase();
  
  // Exact match or very close to seed = primary
  if (keywordLower === seedKeyword.toLowerCase() || 
      seedWords.every(word => keywordLower.includes(word))) {
    return 'primary';
  }
  
  // Long-tail: 4+ words OR low volume with specific intent
  if (wordCount >= 4 || (searchVolume < 500 && wordCount >= 3)) {
    return 'long-tail';
  }
  
  // High volume, 2-3 words, related to seed = secondary
  if (wordCount <= 3 && searchVolume >= 500) {
    return 'secondary';
  }
  
  // Default to long-tail for specific queries
  return 'long-tail';
}

/**
 * Fetch comprehensive keyword data from DataForSEO
 * Includes related keywords, questions, and suggestions
 */
export async function fetchKeywordsFromDataForSEO(
  seedKeyword: string,
  locationCode: number = 2840, // USA
  options?: {
    includeQuestions?: boolean;
    includeRelated?: boolean;
    maxResults?: number;
  }
): Promise<KeywordSet> {
  const {
    includeQuestions = true,
    includeRelated = true,
    maxResults = 50
  } = options || {};

  console.log(`🔍 Fetching keywords from DataForSEO for: "${seedKeyword}"`);

  try {
    const allKeywords = new Map<string, DataForSEOKeyword>();

    // 1. Get search volume for seed keyword
    const searchVolumePayload = [{
      location_code: locationCode,
      keywords: [seedKeyword],
      search_partners: true
    }];

    const searchVolumeResponse = await dataForSeoPost(
      '/keywords_data/google_ads/search_volume/live',
      searchVolumePayload
    );

    // Parse seed keyword data
    if (Array.isArray(searchVolumeResponse?.tasks)) {
      for (const task of searchVolumeResponse.tasks) {
        if (task.status_code === 20000 && Array.isArray(task.result)) {
          for (const result of task.result) {
            if (result.keyword) {
              allKeywords.set(result.keyword.toLowerCase(), result);
            }
          }
        }
      }
    }

    // 2. Get related keywords (keywords_for_keywords)
    if (includeRelated) {
      console.log('📊 Fetching related keywords...');
      
      const relatedPayload = [{
        location_code: locationCode,
        keywords: [seedKeyword],
        search_partners: true,
        include_serp_info: false
      }];

      const relatedResponse = await dataForSeoPost(
        '/keywords_data/google_ads/keywords_for_keywords/live',
        relatedPayload
      );

      if (Array.isArray(relatedResponse?.tasks)) {
        for (const task of relatedResponse.tasks) {
          if (task.status_code === 20000 && Array.isArray(task.result)) {
            for (const result of task.result) {
              if (result.keyword && !allKeywords.has(result.keyword.toLowerCase())) {
                allKeywords.set(result.keyword.toLowerCase(), result);
              }
            }
          }
        }
      }
    }

    // 3. Get keyword suggestions (broader variants)
    console.log('💡 Fetching keyword suggestions...');
    
    const suggestionsPayload = [{
      location_code: locationCode,
      keywords: [seedKeyword],
      search_partners: true
    }];

    const suggestionsResponse = await dataForSeoPost(
      '/keywords_data/google_ads/keywords_for_keywords/live',
      suggestionsPayload
    );

    if (Array.isArray(suggestionsResponse?.tasks)) {
      for (const task of suggestionsResponse.tasks) {
        if (task.status_code === 20000 && Array.isArray(task.result)) {
          for (const result of task.result) {
            if (result.keyword && !allKeywords.has(result.keyword.toLowerCase())) {
              allKeywords.set(result.keyword.toLowerCase(), result);
            }
          }
        }
      }
    }

    // 4. Get question-based keywords if requested
    if (includeQuestions) {
      console.log('❓ Fetching question keywords...');
      
      // Search for common question patterns
      const questionPrefixes = ['how', 'what', 'why', 'when', 'where', 'which'];
      const questionKeywords = questionPrefixes.map(prefix => `${prefix} ${seedKeyword}`);

      const questionsPayload = [{
        location_code: locationCode,
        keywords: questionKeywords.slice(0, 3), // Limit to avoid quota
        search_partners: true
      }];

      try {
        const questionsResponse = await dataForSeoPost(
          '/keywords_data/google_ads/search_volume/live',
          questionsPayload
        );

        if (Array.isArray(questionsResponse?.tasks)) {
          for (const task of questionsResponse.tasks) {
            if (task.status_code === 20000 && Array.isArray(task.result)) {
              for (const result of task.result) {
                if (result.keyword && result.search_volume > 0) {
                  allKeywords.set(result.keyword.toLowerCase(), result);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Question keywords fetch failed:', err);
      }
    }

    console.log(`✅ Retrieved ${allKeywords.size} keywords from DataForSEO`);

    // Convert to enriched format and classify
    const enrichedKeywords: EnrichedKeyword[] = Array.from(allKeywords.values())
      .filter(kw => kw.search_volume > 0) // Filter out zero volume
      .map(kw => {
        const searchVolume = Number(kw.search_volume || 0);
        const difficulty = Number(kw.competition_index || kw.keyword_difficulty || 0);
        const cpc = Number(kw.cpc || 0);
        
        return {
          keyword: kw.keyword,
          searchVolume,
          difficulty,
          cpc,
          type: classifyKeyword(kw.keyword, searchVolume, difficulty, seedKeyword),
          monthlyTrends: kw.keyword_info?.monthly_searches?.map(m => ({
            month: `${m.year}-${String(m.month).padStart(2, '0')}`,
            volume: m.search_volume
          }))
        };
      })
      .sort((a, b) => b.searchVolume - a.searchVolume) // Sort by volume
      .slice(0, maxResults);

    // Separate by type
    const primary = enrichedKeywords.filter(k => k.type === 'primary');
    const secondary = enrichedKeywords.filter(k => k.type === 'secondary');
    const longTail = enrichedKeywords.filter(k => k.type === 'long-tail');

    console.log(`📈 Classified keywords:
  Primary: ${primary.length}
  Secondary: ${secondary.length}
  Long-tail: ${longTail.length}`);

    return {
      primary,
      secondary,
      longTail,
      all: enrichedKeywords
    };

  } catch (error) {
    console.error('❌ DataForSEO keyword fetch error:', error);
    throw error;
  }
}

/**
 * Get keyword difficulty and SERP data
 */
export async function getKeywordDifficulty(
  keywords: string[],
  locationCode: number = 2840
): Promise<Map<string, number>> {
  const difficultyMap = new Map<string, number>();

  try {
    const payload = [{
      location_code: locationCode,
      keywords: keywords.slice(0, 100), // API limit
      language_code: 'en'
    }];

    const response = await dataForSeoPost(
      '/dataforseo_labs/google/bulk_keyword_difficulty/live',
      payload
    );

    if (Array.isArray(response?.tasks)) {
      for (const task of response.tasks) {
        if (task.status_code === 20000 && Array.isArray(task.result)) {
          for (const result of task.result) {
            if (result.keyword && result.keyword_difficulty !== undefined) {
              difficultyMap.set(
                result.keyword.toLowerCase(),
                Number(result.keyword_difficulty)
              );
            }
          }
        }
      }
    }

    return difficultyMap;
  } catch (error) {
    console.error('Error fetching keyword difficulty:', error);
    return difficultyMap;
  }
}

/**
 * Format keywords for content generation prompt
 */
export function formatKeywordsForPrompt(keywordSet: KeywordSet): string {
  let prompt = '';

  if (keywordSet.primary.length > 0) {
    prompt += `PRIMARY KEYWORDS (use in title, H1, first paragraph):\n`;
    keywordSet.primary.forEach(k => {
      prompt += `- "${k.keyword}" (${k.searchVolume.toLocaleString()} searches/month, difficulty: ${k.difficulty}%)\n`;
    });
    prompt += '\n';
  }

  if (keywordSet.secondary.length > 0) {
    prompt += `SECONDARY KEYWORDS (use in H2 headings, throughout body):\n`;
    keywordSet.secondary.slice(0, 10).forEach(k => {
      prompt += `- "${k.keyword}" (${k.searchVolume.toLocaleString()} searches/month)\n`;
    });
    prompt += '\n';
  }

  if (keywordSet.longTail.length > 0) {
    prompt += `LONG-TAIL KEYWORDS (use in H3 subsections, FAQ questions):\n`;
    keywordSet.longTail.slice(0, 15).forEach(k => {
      prompt += `- "${k.keyword}" (${k.searchVolume.toLocaleString()} searches/month)\n`;
    });
    prompt += '\n';
  }

  return prompt;
}

/**
 * Save keywords to database
 */
export async function saveKeywordsToDatabase(
  keywordSet: KeywordSet,
  projectId: string,
  userId: string
) {
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();

  const keywordsToInsert = keywordSet.all.map(k => ({
    keyword: k.keyword,
    search_volume: k.searchVolume,
    difficulty: k.difficulty,
    cpc: k.cpc,
    keyword_type: k.type,
    project_id: projectId,
    user_id: userId,
    source: 'dataforseo',
    related_keywords: k.relatedKeywords || [],
    monthly_trends: k.monthlyTrends || []
  }));

  const { data, error } = await supabase
    .from('discovered_keywords')
    .insert(keywordsToInsert);

  if (error) {
    console.error('Error saving keywords:', error);
    throw error;
  }

  console.log(`💾 Saved ${keywordsToInsert.length} keywords to database`);
  return data;
}

