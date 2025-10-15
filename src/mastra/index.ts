
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { competitiveAnalysisAgent } from './agents/competitive-analysis-agent';
import { contentWriterAgent } from './agents/content-writer-agent';
import { imageSearchAgent } from './agents/image-search-agent';
import { seoResearchAgent } from './agents/seo-research-agent';
// import { MemoryStore } from '@mastra/memory/storage';

export const mastra = new Mastra({
    agents: { competitiveAnalysisAgent, contentWriterAgent, imageSearchAgent, seoResearchAgent },
    // storage: new MemoryStore(),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
    telemetry: {
      // Telemetry is deprecated and will be removed in the Nov 4th release
      enabled: false, 
    },
  });
  