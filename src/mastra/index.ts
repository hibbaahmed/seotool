
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { competitiveAnalysisAgent } from './agents/competitive-analysis-agent';
import { contentWriterAgent } from './agents/content-writer-agent';
import { imageSearchAgent } from './agents/image-search-agent';
import { seoResearchAgent } from './agents/seo-research-agent';
import { LibSQLStore } from '@mastra/libsql';

export const mastra = new Mastra({
    agents: { competitiveAnalysisAgent, contentWriterAgent, imageSearchAgent, seoResearchAgent },
    storage: new LibSQLStore({
      // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
      url: ":memory:",
    }),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
    telemetry: {
      // Telemetry is deprecated and will be removed in the Nov 4th release
      enabled: false, 
    },
    observability: {
      // Enables AI tracing
      enabled: true,
      instances: {
        default: { enabled: true }
      }
    },
  });
  