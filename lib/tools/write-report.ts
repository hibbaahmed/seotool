import { createTool } from '@mastra/core';
import { z } from 'zod';
import { createBlog } from './blog';

export const writeReportTool = createTool({
  id: 'write-report',
  description: 'Writes a simple markdown report and returns its path',
  inputSchema: z.object({
    title: z.string(),
    content: z.string()
  }),
  outputSchema: z.object({
    path: z.string()
  }),
  execute: async ({ context }) => {
    const { title, content } = context as { title: string; content: string };
    const path = await createBlog(title, content, 'markdown');
    return { path };
  }
});
