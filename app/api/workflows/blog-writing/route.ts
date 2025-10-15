import { NextRequest, NextResponse } from 'next/server';
import { blogWritingWorkflow } from '@/lib/workflows';
import { contentWriterAgent } from '@/lib/agents/content-writer-agent';
import { writeBlogPost } from '@/lib/tools/write-report';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, brand } = body;

    if (!topic || !brand) {
      return NextResponse.json(
        { success: false, error: 'Topic and brand are required' },
        { status: 400 }
      );
    }

    // Run the blog writing workflow
    const run = await blogWritingWorkflow.createRunAsync({});
    const result = await run.start({
      inputData: {
        topic,
        brand
      }
    });

    // Guard against failed workflow result
    const safeResult = (result as any)?.result ?? {};
    const { content, title, filePath } = safeResult;
    if (!content || !title || !filePath) {
      // Fallback: directly ask contentWriterAgent to generate and write the post
      const fallbackPrompt = `Write a comprehensive, SEO-optimized blog post about "${topic}" for the brand "${brand}".
Include a compelling title and ensure the article is at least 1200 words with clear section headers.`;

      const { object } = await contentWriterAgent.generate(fallbackPrompt, {
        output: {
          schema: {
            content: 'string',
            title: 'string'
          } as any
        } as any
      });

      const fallbackContent = (object as any)?.content ?? (typeof object === 'string' ? object : '');
      const fallbackTitle = (object as any)?.title ?? `Blog post about ${topic}`;

      if (!fallbackContent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Workflow failed and fallback generation returned empty content',
            details: safeResult
          },
          { status: 502 }
        );
      }

      const sanitizedTitle = fallbackTitle
        .toLowerCase()
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .trim();

      const fallbackFilePath = await writeBlogPost(
        sanitizedTitle,
        fallbackContent,
        fallbackTitle,
        // Minimal SEO data in fallback
        {
          primaryKeyword: { keyword: topic, searchVolume: 0, difficulty: 0, intent: 'informational' },
          secondaryKeywords: [],
          contentAngle: 'general overview',
          estimatedTrafficPotential: 0
        } as any
      );

      return NextResponse.json({
        success: true,
        blogPost: {
          title: fallbackTitle,
          content: fallbackContent,
          filePath: fallbackFilePath
        },
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    return NextResponse.json({
      success: true,
      blogPost: {
        title,
        content,
        filePath
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Blog writing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to write blog post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

