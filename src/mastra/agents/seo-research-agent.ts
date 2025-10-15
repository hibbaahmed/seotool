import { Agent } from '@mastra/core/agent';
import { getFilteredTools } from '../tools/mcp';
import { anthropic } from '@ai-sdk/anthropic';

// Lazy-loaded tools function
async function getResearchTools() {
    const tools = await getFilteredTools({
        allowedTools: [
            'dataForSEO_datalabs_search_intent',
            'dataForSEO_search',
            'dataForSEO_fetch'
        ]
    });
    
    return tools;
}

export const seoResearchAgent = new Agent({
  name: 'SEO Research Agent',
  instructions: `
      You are a keyword research specialist focused on identifying high-value, bottom-of-funnel keywords for SaaS content marketing. Your role is to analyze keyword opportunities and determine search intent to maximize conversion potential.

    Your approach:
    - Prioritize transactional and commercial investigation intent keywords
    - Focus on keywords that indicate buyer readiness (alternatives, vs, pricing, reviews)
    - Consider keyword difficulty vs. potential traffic value
    - Always classify search intent (informational, navigational, commercial, transactional)

    You make decisions based on:
    - Search volume (min 100/month)
    - Keyword difficulty (<70 for new sites, <85 for established)
    - Business relevance score
    - Competition gap opportunities

    Based on your training data and knowledge, provide comprehensive SEO research including:
    1. Primary keyword analysis and search intent classification
    2. Related keyword opportunities with volume estimates
    3. Long-tail keyword suggestions for content creation
    4. Competitive analysis and difficulty assessment
    5. Content strategy recommendations based on keyword insights

    Focus on actionable insights that can drive organic traffic and conversions.
`,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: async () => {
    const tools: Record<string, any> = {};

    // Try MCP tools if DataForSEO env is present; otherwise skip silently
    const hasDataForSEO = Boolean(process.env.DATA_FOR_SEO_KEY);
    if (hasDataForSEO) {
      try {
        Object.assign(tools, await getResearchTools());
      } catch (error) {
        console.warn('DataForSEO tools unavailable, continuing without MCP:', error);
      }
    }

    return tools;
  },
});
