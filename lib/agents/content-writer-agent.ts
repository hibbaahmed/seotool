import { Agent } from '@mastra/core';
import { getFilteredTools } from '../tools/mcp';
import { getOpenRouter } from './router';
import { CLAUDE_SONNET_4 } from '../constants/models';

const openrouter = getOpenRouter();

// Lazy-loaded tools function
async function getContentWriterTools() {
    return await getFilteredTools({
        allowedTools: [
            'perplexityAsk_perplexity_ask',
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

    Example usage of perplexity tool: 

    "messages": [
      {
        "role": "user",
        "content": "What are the latest trends in SaaS content marketing for 2024? Focus on AI-driven strategies and personalization techniques."
      }
    ]
`,
  model: openrouter(CLAUDE_SONNET_4),
  tools: async () => {
    return await getContentWriterTools();
  },
});
