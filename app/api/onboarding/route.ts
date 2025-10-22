import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OnboardingRequest {
  websiteUrl: string;
  businessName?: string;
  industry?: string;
  targetAudience?: string;
  businessDescription?: string;
}

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityLevel: 'low' | 'medium' | 'high';
  cpc: number;
  source: 'competitor' | 'site_analysis' | 'google_trends' | 'serp_analysis';
  competitorDomain?: string;
  serpPosition?: number;
  keywordIntent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  relatedKeywords: string[];
}

interface CompetitorData {
  domain: string;
  name: string;
  domainAuthority: number;
  monthlyTraffic: number;
  topPages: any[];
  keywords: string[];
}

interface SiteAnalysisData {
  domain: string;
  currentKeywords: string[];
  missingKeywords: string[];
  technicalIssues: any[];
  contentGaps: any[];
}

interface SeedContext {
  domain: string;
  businessName?: string;
  industry?: string;
  description?: string;
  targetAudience?: string;
  seedTopics: string[];
  excludedTopics: string[];
}

// DataForSEO client
async function dataForSeoPost(path: string, payload: any): Promise<any> {
  const baseUrl = process.env.DATAFORSEO_BASE_URL || 'https://api.dataforseo.com/v3';
  // Use only DATA_FOR_SEO_KEY (either base64("username:password") or plaintext "username:password")
  let auth = process.env.DATA_FOR_SEO_KEY || '';
  // If value looks like plain "user:pass", base64 encode it
  if (auth.includes(':')) {
    auth = Buffer.from(auth, 'utf-8').toString('base64');
  }
  // If not base64-looking, try to decode; if it doesn't contain ':', we can't use it
  try {
    const decoded = Buffer.from(auth, 'base64').toString('utf-8');
    if (!decoded.includes(':')) {
      throw new Error('Invalid DataForSEO credentials');
    }
  } catch (e) {
    throw new Error('Invalid DataForSEO credentials. Provide base64(username:password) or plaintext username:password');
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

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, businessName, industry, targetAudience, businessDescription }: OnboardingRequest = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Get authenticated user from Supabase cookies
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignore for route handlers
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Create onboarding profile
    const { data: onboardingProfile, error: profileError } = await supabase
      .from('user_onboarding_profiles')
      .insert({
        user_id: userId,
        website_url: websiteUrl,
        business_name: businessName,
        industry: industry,
        target_audience: targetAudience,
        business_description: businessDescription,
        onboarding_status: 'in_progress',
        analysis_progress: {
          competitor_analysis: false,
          site_analysis: false,
          google_trends: false,
          serp_analysis: false,
          keyword_scoring: false
        }
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating onboarding profile:', profileError);
      return NextResponse.json({ error: 'Failed to create onboarding profile' }, { status: 500 });
    }

    // Build a seed context from the website and user-provided business details
    const seedContext = await buildSeedContext({
      websiteUrl,
      businessName,
      industry,
      targetAudience,
      businessDescription,
    });

    // Start comprehensive analysis with the seed context
    const analysisResults = await performComprehensiveAnalysis(seedContext);

    // Save analysis results to database
    await saveAnalysisResults(userId, onboardingProfile.id, analysisResults);

    // Update onboarding status to completed
    await supabase
      .from('user_onboarding_profiles')
      .update({ 
        onboarding_status: 'completed',
        analysis_progress: {
          competitor_analysis: true,
          site_analysis: true,
          google_trends: true,
          serp_analysis: true,
          keyword_scoring: true
        }
      })
      .eq('id', onboardingProfile.id);

    return NextResponse.json({
      success: true,
      onboardingProfileId: onboardingProfile.id,
      analysisResults: {
        totalKeywords: analysisResults.allKeywords.length,
        highOpportunityKeywords: analysisResults.allKeywords.filter(k => k.opportunityLevel === 'high').length,
        mediumOpportunityKeywords: analysisResults.allKeywords.filter(k => k.opportunityLevel === 'medium').length,
        lowOpportunityKeywords: analysisResults.allKeywords.filter(k => k.opportunityLevel === 'low').length,
        competitorsAnalyzed: analysisResults.competitors.length,
        siteIssuesFound: analysisResults.siteAnalysis.technicalIssues.length,
        contentGapsIdentified: analysisResults.siteAnalysis.contentGaps.length
      }
    });

  } catch (error) {
    console.error('Onboarding analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

async function performComprehensiveAnalysis(seed: SeedContext) {
  const domain = seed.domain;

  // Run all analysis in parallel using the seed context
  const [
    competitorAnalysis,
    siteAnalysis,
    googleTrendsAnalysis,
    serpAnalysis
  ] = await Promise.all([
    analyzeCompetitors(domain, seed),
    analyzeSite(domain, seed),
    analyzeGoogleTrends(seed),
    analyzeSERP(domain, seed)
  ]);

  // Combine all keywords and deduplicate
  const allKeywordsRaw = combineAndDeduplicateKeywords([
    competitorAnalysis.keywords,
    siteAnalysis.keywords,
    googleTrendsAnalysis.keywords,
    serpAnalysis.keywords
  ]);

  // Enrich with real metrics from DataForSEO
  const enriched = await enrichWithDataForSeo(allKeywordsRaw, seed);

  // Filter to keep only highly relevant keywords for the seed topics
  const filtered = filterRelevantKeywords(enriched, seed);

  // Score keywords for opportunity levels
  const scoredKeywords = await scoreKeywords(filtered, {
    competitors: competitorAnalysis.competitors,
    siteAnalysis: siteAnalysis,
    industry: seed.industry,
    targetAudience: seed.targetAudience
  });

  return {
    allKeywords: scoredKeywords,
    competitors: competitorAnalysis.competitors,
    siteAnalysis: siteAnalysis,
    googleTrends: googleTrendsAnalysis,
    serpAnalysis: serpAnalysis
  };
}

async function analyzeCompetitors(domain: string, seed: SeedContext): Promise<{ competitors: CompetitorData[], keywords: KeywordData[] }> {
  try {
    // Ask AI for competitors and keyword gaps, enforced JSON
    const competitorPrompt = `You are an SEO analyst.
Domain: ${domain}
Industry: ${seed.industry || 'technology'}
Business description: ${seed.description || 'N/A'}
Target audience: ${seed.targetAudience || 'N/A'}
Seed topics: ${seed.seedTopics.join(', ')}

Return STRICT JSON with this shape (and nothing else):
{
  "competitors": [{"domain": "string", "name": "string"}],
  "keywords": [{"keyword": "string", "searchVolume": number, "difficulty": number, "cpc": number, "related": ["string"]}]
}
Rules:
- Only include keywords tightly relevant to the seed topics and industry.
- Avoid generic terms like "generic tech blogs", "traditional web hosting", "basic app development".
- Prefer 2-4 word phrases, specific to the business.
- searchVolume is an estimate; difficulty 0-100.
`;

    const competitorResponse = await callAI(competitorPrompt);
    const json = parseJsonFromAi(competitorResponse) as { competitors?: any[]; keywords?: any[] };
    const competitors: CompetitorData[] = (json.competitors || []).map((c: any) => ({
      domain: c.domain || '',
      name: c.name || c.domain || '',
      domainAuthority: 0,
      monthlyTraffic: 0,
      topPages: [],
      keywords: [],
    }));

    const keywords: KeywordData[] = (json.keywords || []).map((k: any) => ({
      keyword: String(k.keyword || '').trim(),
      searchVolume: Number(k.searchVolume || 0),
      difficulty: Number(k.difficulty || 50),
      opportunityLevel: 'medium' as const,
      cpc: Number(k.cpc || 0),
      source: 'competitor' as const,
      competitorDomain: competitors[0]?.domain,
      keywordIntent: determineKeywordIntent(String(k.keyword || '')),
      relatedKeywords: Array.isArray(k.related) ? k.related as string[] : [],
    })).filter(k => k.keyword);

    return { competitors, keywords };
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return { competitors: [], keywords: [] };
  }
}

async function analyzeSite(domain: string, seed: SeedContext): Promise<SiteAnalysisData & { keywords: KeywordData[] }> {
  try {
    const html = await fetchWebsiteHtml(`https://${domain}`);
    const siteSummary = await summarizeWebsite(html, seed);

    const siteData: SiteAnalysisData = {
      domain,
      currentKeywords: siteSummary.topKeywords || [],
      missingKeywords: [],
      technicalIssues: [],
      contentGaps: [],
    };

    const keywords: KeywordData[] = (siteData.currentKeywords || []).map((kw) => ({
      keyword: kw,
      searchVolume: 0,
      difficulty: 50,
      opportunityLevel: 'medium',
      cpc: 0,
      source: 'site_analysis',
      keywordIntent: determineKeywordIntent(kw),
      relatedKeywords: [],
    }));

    return {
      ...siteData,
      keywords
    };
  } catch (error) {
    console.error('Site analysis error:', error);
    return {
      domain,
      currentKeywords: [],
      missingKeywords: [],
      technicalIssues: [],
      contentGaps: [],
      keywords: []
    };
  }
}

async function analyzeGoogleTrends(seed: SeedContext): Promise<{ keywords: KeywordData[] }> {
  try {
    const trendsPrompt = `You are using Google Trends like knowledge to propose trending keywords.
Industry: ${seed.industry || 'technology'}
Seed topics: ${seed.seedTopics.join(', ')}
Target audience: ${seed.targetAudience || 'N/A'}

Return STRICT JSON array named keywords: [{"keyword": "string", "searchVolume": number, "difficulty": number, "cpc": number}].
Rules: focus ONLY on the seed topics and exclude: ${seed.excludedTopics.join(', ') || 'none'}; avoid generic queries.`;

    const trendsResponse = await callAI(trendsPrompt);
    const json = parseJsonFromAi(trendsResponse) as { keywords?: any[] } | any[];
    const list = Array.isArray(json) ? json : json?.keywords || [];
    const keywords: KeywordData[] = list.map((k: any) => ({
      keyword: String(k.keyword || '').trim(),
      searchVolume: Number(k.searchVolume || 0),
      difficulty: Number(k.difficulty || 50),
      opportunityLevel: 'high' as const,
      cpc: Number(k.cpc || 0),
      source: 'google_trends' as const,
      keywordIntent: determineKeywordIntent(String(k.keyword || '')),
      relatedKeywords: [],
    })).filter(k => k.keyword);

    return { keywords };
  } catch (error) {
    console.error('Google Trends analysis error:', error);
    return { keywords: [] };
  }
}

async function analyzeSERP(domain: string, seed: SeedContext): Promise<{ keywords: KeywordData[] }> {
  try {
    const serpPrompt = `Analyze SERPs for topics strictly related to: ${seed.seedTopics.join(', ')} in the ${seed.industry || 'technology'} industry.
Exclude generic topics: ${seed.excludedTopics.join(', ') || 'none'}.
Return STRICT JSON array named keywords: [{"keyword": "string", "searchVolume": number, "difficulty": number, "cpc": number, "position": number, "related": ["string"]}].`;

    const serpResponse = await callAI(serpPrompt);
    const json = parseJsonFromAi(serpResponse) as { keywords?: any[] } | any[];
    const list = Array.isArray(json) ? json : json?.keywords || [];

    const keywords: KeywordData[] = list.map((item: any) => ({
      keyword: String(item.keyword || '').trim(),
      searchVolume: Number(item.searchVolume || 0),
      difficulty: Number(item.difficulty || 50),
      opportunityLevel: 'medium' as const,
      cpc: Number(item.cpc || 0),
      source: 'serp_analysis' as const,
      serpPosition: Number(item.position || 0),
      keywordIntent: determineKeywordIntent(String(item.keyword || '')),
      relatedKeywords: Array.isArray(item.related) ? item.related as string[] : [],
    })).filter(k => k.keyword);

    return { keywords };
  } catch (error) {
    console.error('SERP analysis error:', error);
    return { keywords: [] };
  }
}

async function scoreKeywords(keywords: KeywordData[], context: any): Promise<KeywordData[]> {
  // Implement keyword scoring logic
  return keywords.map(keyword => {
    let opportunityScore = 0;
    
    // Score based on search volume
    if (keyword.searchVolume > 10000) opportunityScore += 30;
    else if (keyword.searchVolume > 1000) opportunityScore += 20;
    else if (keyword.searchVolume > 100) opportunityScore += 10;
    
    // Score based on difficulty
    if (keyword.difficulty < 30) opportunityScore += 30;
    else if (keyword.difficulty < 60) opportunityScore += 20;
    else if (keyword.difficulty < 80) opportunityScore += 10;
    
    // Score based on source
    if (keyword.source === 'google_trends') opportunityScore += 20;
    else if (keyword.source === 'serp_analysis') opportunityScore += 15;
    else if (keyword.source === 'competitor') opportunityScore += 10;
    else if (keyword.source === 'site_analysis') opportunityScore += 5;
    
    // Score based on keyword intent
    if (keyword.keywordIntent === 'commercial') opportunityScore += 15;
    else if (keyword.keywordIntent === 'transactional') opportunityScore += 20;
    else if (keyword.keywordIntent === 'informational') opportunityScore += 10;
    
    // Determine opportunity level
    let opportunityLevel: 'low' | 'medium' | 'high';
    if (opportunityScore >= 70) opportunityLevel = 'high';
    else if (opportunityScore >= 40) opportunityLevel = 'medium';
    else opportunityLevel = 'low';
    
    return {
      ...keyword,
      opportunityLevel
    };
  });
}

function combineAndDeduplicateKeywords(keywordArrays: KeywordData[][]): KeywordData[] {
  const keywordMap = new Map<string, KeywordData>();
  
  keywordArrays.flat().forEach(keyword => {
    const existing = keywordMap.get(keyword.keyword.toLowerCase());
    if (existing) {
      // Merge data, keeping the best metrics
      keywordMap.set(keyword.keyword.toLowerCase(), {
        ...keyword,
        searchVolume: Math.max(existing.searchVolume, keyword.searchVolume),
        cpc: Math.max(existing.cpc, keyword.cpc),
        relatedKeywords: [...new Set([...existing.relatedKeywords, ...keyword.relatedKeywords])]
      });
    } else {
      keywordMap.set(keyword.keyword.toLowerCase(), keyword);
    }
  });
  
  return Array.from(keywordMap.values());
}

function filterRelevantKeywords(keywords: KeywordData[], seed: SeedContext): KeywordData[] {
  const genericBlacklist = [
    'generic tech blogs',
    'basic app development',
    'traditional web hosting',
    'legacy software queries',
    'technology news',
    'latest tech trends',
  ];
  const topicSet = new Set(seed.seedTopics.map((t) => t.toLowerCase()));
  const excluded = new Set(seed.excludedTopics.map((t) => t.toLowerCase()));

  const isRelevant = (kw: string) => {
    const lower = kw.toLowerCase();
    if (genericBlacklist.some((g) => lower.includes(g))) return false;
    if (Array.from(excluded).some((g) => lower.includes(g))) return false;
    if (topicSet.size === 0) return true;
    return Array.from(topicSet).some((t) => lower.includes(t));
  };

  return keywords.filter((k) => isRelevant(k.keyword));
}

async function buildSeedContext(args: { websiteUrl: string; businessName?: string; industry?: string; targetAudience?: string; businessDescription?: string; }): Promise<SeedContext> {
  const domain = extractDomain(args.websiteUrl);
  let seedTopics: string[] = [];
  let excludedTopics: string[] = [];

  try {
    const html = await fetchWebsiteHtml(`https://${domain}`);
    const summary = await summarizeWebsite(html, {
      domain,
      businessName: args.businessName,
      industry: args.industry,
      description: args.businessDescription,
      targetAudience: args.targetAudience,
      seedTopics: [],
      excludedTopics: [],
    });
    seedTopics = summary.seedTopics || [];
    excludedTopics = summary.excludedTopics || [];
  } catch {}

  // Fallback seeds if we didn't get any from the site
  if (seedTopics.length === 0 && args.industry) {
    seedTopics = [args.industry];
  }

  return {
    domain,
    businessName: args.businessName,
    industry: args.industry,
    description: args.businessDescription,
    targetAudience: args.targetAudience,
    seedTopics,
    excludedTopics,
  };
}

async function fetchWebsiteHtml(url: string): Promise<string> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

async function summarizeWebsite(html: string, seed: SeedContext): Promise<{ seedTopics: string[]; excludedTopics: string[]; topKeywords: string[] }> {
  if (!html) return { seedTopics: [], excludedTopics: [], topKeywords: [] };
  const prompt = `Summarize the following website HTML to extract SEO seed topics.
Industry: ${seed.industry || 'technology'}
Business description: ${seed.description || 'N/A'}
Target audience: ${seed.targetAudience || 'N/A'}

Return STRICT JSON with keys: seedTopics (array of 6-12 short 1-3 word topics), excludedTopics (array of generic/irrelevant items to avoid), topKeywords (array of current brand/product keywords if present). No markdown.`;
  const response = await callAI(prompt + `\n\nHTML:\n"""${html.slice(0, 12000)}"""`);
  const json = parseJsonFromAi(response) as any;
  return {
    seedTopics: Array.isArray(json?.seedTopics) ? json.seedTopics : [],
    excludedTopics: Array.isArray(json?.excludedTopics) ? json.excludedTopics : [],
    topKeywords: Array.isArray(json?.topKeywords) ? json.topKeywords : [],
  };
}

function parseJsonFromAi(text: string): any {
  // Try to locate the first JSON object/array in the string
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  const start = startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
  if (start === -1) return {};
  const substr = text.slice(start);
  // Attempt simple balance-based extraction
  let depth = 0;
  let end = -1;
  for (let i = 0; i < substr.length; i++) {
    const ch = substr[i];
    if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  const jsonStr = end !== -1 ? substr.slice(0, end) : substr;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return {};
  }
}

// Use DataForSEO Labs endpoints to enrich metrics
async function enrichWithDataForSeo(keywords: KeywordData[], seed: SeedContext): Promise<KeywordData[]> {
  if (!keywords.length) return keywords;
  const unique = Array.from(new Set(keywords.map(k => k.keyword))).slice(0, 100);

  try {
    // Strategy: call related_keywords/live and keyword_suggestions/live in batches
    const seeds = unique.slice(0, 10); // limit seeds per call window
    const commonTask = {
      location_code: 2840,
      language_code: 'en',
      limit: 100
    } as const;

    const relatedPayload = { data: seeds.map((kw) => ({ ...commonTask, keyword: kw })) };
    const suggestionsPayload = { data: seeds.map((kw) => ({ ...commonTask, keyword: kw })) };

    const [relatedResp, suggestionsResp] = await Promise.all([
      dataForSeoPost('/dataforseo_labs/google/related_keywords/live', relatedPayload),
      dataForSeoPost('/dataforseo_labs/google/keyword_suggestions/live', suggestionsPayload)
    ]);

    const metricMap = new Map<string, { sv: number; kd: number; cpc: number }>();

    const harvest = (resp: any) => {
      if (!Array.isArray(resp?.tasks)) return;
      for (const t of resp.tasks) {
        const results = Array.isArray(t?.result) ? t.result : [];
        for (const r of results) {
          const items = Array.isArray(r?.items) ? r.items : [];
          for (const it of items) {
            const key = String(it.keyword || it?.keyword_info?.keyword || '').toLowerCase();
            const info = it.keyword_info || {};
            const sv = Number(info.search_volume || it.search_volume || 0);
            const cpcRaw = Number(info.cpc || it.cpc || 0);
            const cpc = cpcRaw > 10 ? cpcRaw / 100 : cpcRaw; // normalize if in cents
            // Difficulty approximation: competition_index (0..1) or competition (0..1) → 0..100
            const comp = Number(info.competition_index ?? info.competition ?? 0);
            const kd = Math.max(0, Math.min(100, Math.round(comp * 100)));
            if (key) metricMap.set(key, { sv, kd, cpc });
          }
        }
      }
    };

    harvest(relatedResp);
    harvest(suggestionsResp);

    return keywords.map(k => {
      const m = metricMap.get(k.keyword.toLowerCase());
      if (!m) return k;
      return {
        ...k,
        searchVolume: m.sv || k.searchVolume,
        difficulty: isFinite(m.kd) && m.kd > 0 && m.kd <= 100 ? m.kd : k.difficulty,
        cpc: isFinite(m.cpc) ? m.cpc : k.cpc,
      };
    });
  } catch (e) {
    console.error('DataForSEO enrichment error:', e);
    return keywords; // fall back to existing
  }
}

async function saveAnalysisResults(userId: string, onboardingProfileId: string, results: any) {
  try {
    // Save competitors
    for (const competitor of results.competitors) {
      await supabase.from('competitor_analysis').insert({
        user_id: userId,
        onboarding_profile_id: onboardingProfileId,
        competitor_domain: competitor.domain,
        competitor_name: competitor.name,
        analysis_type: 'domain_analysis',
        analysis_data: competitor,
        keywords_found: competitor.keywords,
        domain_authority: competitor.domainAuthority,
        monthly_traffic: competitor.monthlyTraffic,
        top_pages: competitor.topPages
      });
    }

    // Save site analysis
    await supabase.from('site_analysis').insert({
      user_id: userId,
      onboarding_profile_id: onboardingProfileId,
      domain: results.siteAnalysis.domain,
      analysis_type: 'comprehensive',
      analysis_data: results.siteAnalysis,
      current_keywords: results.siteAnalysis.currentKeywords,
      missing_keywords: results.siteAnalysis.missingKeywords,
      technical_issues: results.siteAnalysis.technicalIssues,
      content_gaps: results.siteAnalysis.contentGaps
    });

    // Save keywords
    for (const keyword of results.allKeywords) {
      const { data: keywordRecord } = await supabase.from('discovered_keywords').insert({
        user_id: userId,
        onboarding_profile_id: onboardingProfileId,
        keyword: keyword.keyword,
        search_volume: keyword.searchVolume,
        difficulty_score: keyword.difficulty,
        opportunity_level: keyword.opportunityLevel,
        cpc: keyword.cpc,
        source: keyword.source,
        competitor_domain: keyword.competitorDomain,
        serp_position: keyword.serpPosition,
        keyword_intent: keyword.keywordIntent,
        related_keywords: keyword.relatedKeywords
      }).select().single();

      // Save keyword opportunities
      if (keywordRecord) {
        await supabase.from('keyword_opportunities').insert({
          user_id: userId,
          onboarding_profile_id: onboardingProfileId,
          keyword_id: keywordRecord.id,
          opportunity_score: calculateOpportunityScore(keyword),
          ranking_potential: calculateRankingPotential(keyword),
          content_opportunity: calculateContentOpportunity(keyword),
          competition_level: keyword.difficulty,
          priority_level: keyword.opportunityLevel === 'high' ? 'high' : keyword.opportunityLevel === 'medium' ? 'medium' : 'low',
          recommended_action: getRecommendedAction(keyword),
          estimated_traffic_potential: Math.floor(keyword.searchVolume * 0.1), // Conservative estimate
          estimated_conversion_potential: keyword.keywordIntent === 'commercial' ? 2.5 : 1.0
        });
      }
    }
  } catch (error) {
    console.error('Error saving analysis results:', error);
  }
}

// Helper functions
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url.replace('www.', '').split('/')[0];
  }
}

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function parseCompetitorData(response: string): CompetitorData[] {
  // Parse AI response to extract competitor data
  // This is a simplified parser - you'd want more robust parsing
  const competitors: CompetitorData[] = [];
  const lines = response.split('\n');
  
  let currentCompetitor: Partial<CompetitorData> = {};
  for (const line of lines) {
    if (line.includes('Domain:') || line.includes('Website:')) {
      if (currentCompetitor.domain) {
        competitors.push(currentCompetitor as CompetitorData);
      }
      currentCompetitor = {
        domain: line.split(':')[1]?.trim() || '',
        name: '',
        domainAuthority: Math.floor(Math.random() * 100),
        monthlyTraffic: Math.floor(Math.random() * 1000000),
        topPages: [],
        keywords: []
      };
    } else if (line.includes('Keywords:') && currentCompetitor.domain) {
      const keywords = line.split(':')[1]?.split(',').map(k => k.trim()) || [];
      currentCompetitor.keywords = keywords;
    }
  }
  
  if (currentCompetitor.domain) {
    competitors.push(currentCompetitor as CompetitorData);
  }
  
  return competitors;
}

function parseSiteAnalysis(response: string): SiteAnalysisData {
  // Parse AI response for site analysis
  return {
    domain: '',
    currentKeywords: [],
    missingKeywords: [],
    technicalIssues: [],
    contentGaps: []
  };
}

function parseTrendsData(response: string): string[] {
  // Parse AI response for trending keywords
  const keywords: string[] = [];
  const lines = response.split('\n');
  
  for (const line of lines) {
    if (line.includes('•') || line.includes('-') || line.includes('*')) {
      const keyword = line.replace(/[•\-*]/g, '').trim();
      if (keyword) keywords.push(keyword);
    }
  }
  
  return keywords;
}

function parseSERPData(response: string): any[] {
  // Parse AI response for SERP analysis
  return [];
}

function determineKeywordIntent(keyword: string): 'informational' | 'commercial' | 'navigational' | 'transactional' {
  const commercialTerms = ['buy', 'price', 'cost', 'cheap', 'best', 'review', 'compare'];
  const transactionalTerms = ['purchase', 'order', 'buy now', 'shop', 'cart'];
  const navigationalTerms = ['login', 'sign in', 'contact', 'about'];
  
  const lowerKeyword = keyword.toLowerCase();
  
  if (transactionalTerms.some(term => lowerKeyword.includes(term))) return 'transactional';
  if (commercialTerms.some(term => lowerKeyword.includes(term))) return 'commercial';
  if (navigationalTerms.some(term => lowerKeyword.includes(term))) return 'navigational';
  return 'informational';
}

function calculateOpportunityScore(keyword: KeywordData): number {
  let score = 0;
  if (keyword.searchVolume > 1000) score += 30;
  if (keyword.difficulty < 50) score += 30;
  if (keyword.source === 'google_trends') score += 20;
  if (keyword.keywordIntent === 'commercial') score += 20;
  return Math.min(score, 100);
}

function calculateRankingPotential(keyword: KeywordData): number {
  return Math.max(0, 100 - keyword.difficulty);
}

function calculateContentOpportunity(keyword: KeywordData): number {
  let score = 50; // Base score
  if (keyword.keywordIntent === 'informational') score += 30;
  if (keyword.searchVolume > 500) score += 20;
  return Math.min(score, 100);
}

function getRecommendedAction(keyword: KeywordData): string {
  if (keyword.difficulty < 30) return 'create_content';
  if (keyword.source === 'competitor') return 'optimize_existing';
  if (keyword.keywordIntent === 'commercial') return 'build_links';
  return 'technical_fix';
}
