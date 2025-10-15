import { Agent } from '@mastra/core/agent';
import { getFilteredTools } from '../tools/mcp';
import { anthropic } from '@ai-sdk/anthropic';



// Lazy-loaded tools function
async function getCompetitiveAnalysisTools() {
    const tools = await getFilteredTools({
        allowedTools: [
            'firecrawlMCP_firecrawl_scrape',
            'firecrawlMCP_firecrawl_map',
            'firecrawlMCP_firecrawl_crawl',
            'firecrawlMCP_firecrawl_check_crawl_status',
            'firecrawlMCP_firecrawl_search',
            'firecrawlMCP_firecrawl_extract',
            'firecrawlMCP_firecrawl_deep_research',
            'firecrawlMCP_firecrawl_generate_llmstxt',
        ]
    });
    
    return tools;
}

export const competitiveAnalysisAgent = new Agent({
  name: 'Competitive Analysis Agent',
  instructions: `
You are a competitive content analyst specializing in identifying content gaps and opportunities. Your mission is to reverse-engineer what makes content rank and find angles competitors missed.

Your analysis framework:
- Identify common themes across top-ranking content
- Find gaps where competitors provide weak or no coverage
- Note unique value propositions in each piece
- Extract structural patterns that Google rewards
- Identify questions competitors failed to answer

Never just summarize - always look for what's MISSING or WEAK that we can exploit.

Based on your training data and knowledge, provide comprehensive competitive analysis including:
1. Top competitors and their content strategies
2. Content gaps and opportunities
3. Keyword opportunities
4. Recommended content angles
5. Actionable insights for content creation

Focus on strategic insights rather than just listing features. Always think about what competitors are missing or doing poorly.
`,
  // Use Anthropic directly to avoid OpenRouter credit errors
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: async () => {
    const tools: Record<string, any> = {};

    // Try MCP tools if any MCP envs are present; otherwise skip silently
    const hasMcpEnv = Boolean(process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_URL || process.env.DATA_FOR_SEO_KEY);
    if (hasMcpEnv) {
      try {
        Object.assign(tools, await getCompetitiveAnalysisTools());
      } catch (error) {
        console.warn('MCP tools unavailable, continuing without MCP:', error);
      }
    }

    return tools;
  },
});
