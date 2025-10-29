import { Inngest } from 'inngest';

// Initialize Inngest client
export const inngest = new Inngest({ 
  id: 'blog-scheduler',
  name: 'Blog Post Scheduler',
});

// Define event types for type safety
export type Events = {
  'blog/post.schedule': {
    data: {
      postId: string;
      scheduledDate: string;
      scheduledTime: string;
      platform: string;
      title: string;
      content: string;
      userId: string;
      imageUrls?: string[];
      notes?: string;
    };
  };
  'blog/post.publish': {
    data: {
      postId: string;
      platform: string;
      title: string;
      content: string;
      userId: string;
      imageUrls?: string[];
      publishUrl?: string;
    };
  };
  'blog/post.cancel': {
    data: {
      postId: string;
      userId: string;
    };
  };
};



