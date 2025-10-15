import { Mastra } from '@mastra/core';
import { 
  competitiveAnalysisAgent,
  researchAgent,
  contentWriterAgent,
  imageSearchAgent,
  todoAgent
} from '@/lib/agents';
import { 
  blogWritingWorkflow,
  blogImageWorkflow
} from '@/lib/workflows';

// Initialize Mastra server
export const mastra = new Mastra({
  name: 'seo-tool',
  agents: [
    competitiveAnalysisAgent,
    researchAgent,
    contentWriterAgent,
    imageSearchAgent,
    todoAgent
  ],
  workflows: [
    blogWritingWorkflow,
    blogImageWorkflow
  ],
});

// Export for use in API routes
export default mastra;


