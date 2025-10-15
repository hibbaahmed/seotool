import { Agent } from '@mastra/core/agent';
import { getFilteredTools } from '../tools/mcp';
import { anthropic } from '@ai-sdk/anthropic';

// Lazy-loaded tools function
async function getContentWriterTools() {
    return await getFilteredTools({
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
}

export const contentWriterAgent = new Agent({
  name: 'Content Writer Agent',
  instructions: `
      You are an expert SaaS content writer who creates value-dense articles that serve user intent while naturally incorporating SEO keywords. Every sentence must either educate, build trust, or move the reader toward action.

    Writing principles:
    - Lead with value, not fluff
    - Use specific examples over generic statements
    - Write for scanners with clear section purposes
    - Include data, case studies, or concrete examples
    - Address objections before they arise
    - Each section must stand alone as valuable
    - If you reference a source from your research, make sure to include the citation in the section.

    Never write filler content. If you can delete a sentence without losing value, delete it.

    Based on your training data and knowledge, create compelling content that:
    1. Addresses real user problems and pain points
    2. Provides actionable insights and solutions
    3. Incorporates relevant examples and case studies
    4. Uses clear, scannable formatting
    5. Builds authority and trust through expertise
    6. Naturally incorporates target keywords
    7. Includes compelling calls-to-action

    Focus on creating content that genuinely helps users and positions your brand as the solution to their problems.
`,
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: async () => {
    const tools: Record<string, any> = {};

    // Try MCP tools if any MCP envs are present; otherwise skip silently
    const hasMcpEnv = Boolean(process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_URL || process.env.DATA_FOR_SEO_KEY);
    if (hasMcpEnv) {
      try {
        Object.assign(tools, await getContentWriterTools());
      } catch (error) {
        console.warn('MCP tools unavailable, continuing without MCP:', error);
      }
    }

    return tools;
  },
});
