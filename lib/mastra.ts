import { Mastra } from '@mastra/core';
import { competitiveAnalysisAgent } from '../src/mastra/agents/competitive-analysis-agent';
import { seoResearchAgent } from '../src/mastra/agents/seo-research-agent';
import { contentWriterAgent } from '../src/mastra/agents/content-writer-agent';
import { imageSearchAgent } from '../src/mastra/agents/image-search-agent';
import { 
  blogWritingWorkflow,
  blogImageWorkflow
} from '../src/mastra/workflows';

// Initialize Mastra server
export const mastra = new Mastra({
  agents: {
    competitiveAnalysisAgent,
    seoResearchAgent,
    contentWriterAgent,
    imageSearchAgent
  },
  workflows: {
    blogWritingWorkflow,
    blogImageWorkflow
  },
});

// Export for use in API routes
export default mastra;


