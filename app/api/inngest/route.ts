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
