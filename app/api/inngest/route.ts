import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { 
  scheduleBlogPost, 
  publishBlogPost, 
  cancelBlogPost,
  dailyContentGeneration,
  generateKeywordContent,
  scheduleKeywordGeneration
} from '@/lib/inngest-functions';

// Ensure Node.js runtime (not edge) and allow long-running executions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Increase max duration so Inngest finalization doesn't hit Vercel timeout
// Set to your plan limit (Pro plan supports up to 800s).
export const maxDuration = 800;

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scheduleBlogPost,
    publishBlogPost,
    cancelBlogPost,
    dailyContentGeneration,
    generateKeywordContent,
    scheduleKeywordGeneration,
  ],
  streaming: "allow",
});
