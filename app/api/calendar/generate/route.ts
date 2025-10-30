import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// POST /api/calendar/generate - Generate content for a keyword immediately
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword_id, keyword, content_type = 'blog post', target_audience, tone = 'professional' } = body;

    if (!keyword_id && !keyword) {
      return NextResponse.json(
        { error: 'Either keyword_id or keyword text is required' },
        { status: 400 }
      );
    }

    let keywordText = keyword;
    let keywordData = null;

    // If keyword_id provided, fetch the keyword details
    if (keyword_id) {
      const { data, error } = await supabase
        .from('discovered_keywords')
        .select('*')
        .eq('id', keyword_id)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
      }

      keywordData = data;
      keywordText = data.keyword;

      // Update status to generating
      await supabase
        .from('discovered_keywords')
        .update({ generation_status: 'generating' })
        .eq('id', keyword_id);
    }

    // Generate content using the content writer API
    const contentPrompt = `Topic: "${keywordText}"
Content Type: ${content_type}
Target Audience: ${target_audience || 'General audience'}
Tone: ${tone}
Length: Long-form (1500-2500 words)

Please create comprehensive, SEO-optimized content for this topic. Include:
- An engaging title and meta description
- Well-structured sections using Markdown headings (## for H2, ### for H3)
- Never write literal labels like "H2:" or "H3:" in the body
- Actionable insights and valuable information
- Natural keyword integration
- Internal linking opportunities
- A strong call-to-action

${keywordData?.related_keywords?.length > 0 ? `Related keywords to naturally incorporate: ${keywordData.related_keywords.join(', ')}` : ''}`;

    // Call the content writer API to generate content
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/content-writer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: contentPrompt }],
        userId: user.id,
      }),
    });

    if (!contentResponse.ok) {
      throw new Error('Content generation failed');
    }

    // Stream the response
    let fullContent = '';
    let imageUrls: string[] = [];
    const reader = contentResponse.body?.getReader();
    
    if (reader) {
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'images' && data.urls) {
                imageUrls = data.urls;
              } else if (data.type === 'token' && data.value) {
                fullContent += data.value;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    }

    // Save the generated content to database
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: savedContent, error: saveError } = await serviceSupabase
      .from('content_writer_outputs')
      .insert({
        user_id: user.id,
        topic: keywordText,
        content_type,
        target_audience: target_audience || 'General audience',
        tone,
        length: 'long',
        content_output: fullContent,
        image_urls: imageUrls,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated content:', saveError);
      // Don't fail the request, just log the error
    }

    // Update keyword with generated content reference
    if (keyword_id && savedContent) {
      await supabase
        .from('discovered_keywords')
        .update({
          generation_status: 'generated',
          generated_content_id: savedContent.id,
          generated_at: new Date().toISOString(),
        })
        .eq('id', keyword_id);
    }

    return NextResponse.json({
      success: true,
      content_id: savedContent?.id,
      content: fullContent,
      image_urls: imageUrls,
    });
  } catch (error) {
    console.error('Content generation API error:', error);
    
    // Update keyword status to failed if applicable
    const body = await request.json();
    if (body.keyword_id) {
      const supabase = await createClient();
      await supabase
        .from('discovered_keywords')
        .update({ generation_status: 'failed' })
        .eq('id', body.keyword_id);
    }
    
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}

