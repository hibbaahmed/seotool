import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest';

/**
 * POST /api/calendar/generate
 * 
 * This endpoint triggers content generation via Inngest to avoid Vercel timeouts.
 * It performs validation and credit checks, then delegates to Inngest for the actual generation.
 * 
 * Flow:
 * 1. Validates user authentication and credits
 * 2. Sends 'calendar/keyword.generate' event to Inngest
 * 3. Returns immediately (Inngest handles the long-running generation)
 * 4. Inngest function generates content and auto-publishes to WordPress
 * 
 * The Inngest function (`generateKeywordContent`) handles:
 * - Multi-phase content generation (4 phases, 6,000-8,500 words, no timeouts)
 * - Image search and upload to Supabase
 * - DataForSEO keyword enrichment
 * - Credit deduction after successful generation
 * - WordPress auto-publishing with internal links
 * - Error handling and status updates
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword_id, keyword } = body;

    if (!keyword_id && !keyword) {
      return NextResponse.json(
        { error: 'Either keyword_id or keyword text is required' },
        { status: 400 }
      );
    }

    // Check if user has enough credits (1 credit required for blog generation)
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !creditsData) {
      return NextResponse.json(
        { error: 'Could not fetch user credits' },
        { status: 500 }
      );
    }

    const currentCredits = creditsData.credits || 0;
    if (currentCredits < 1) {
      return NextResponse.json(
        { error: `Insufficient credits. You need 1 credit to generate content. You currently have ${currentCredits} credit(s).` },
        { status: 402 }
      );
    }

    let keywordText = keyword;
    let relatedKeywords: string[] = [];

    // If keyword_id provided, fetch the keyword details
    if (keyword_id) {
      const { data: keywordData, error } = await supabase
        .from('discovered_keywords')
        .select('*')
        .eq('id', keyword_id)
        .eq('user_id', user.id)
        .single();

      if (error || !keywordData) {
        return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
      }

      keywordText = keywordData.keyword;
      relatedKeywords = (keywordData as any).related_keywords || [];

      // Update status to generating
      await supabase
        .from('discovered_keywords')
        .update({ generation_status: 'generating' })
        .eq('id', keyword_id);
    }

    // Trigger Inngest event for content generation
    // The Inngest function will handle all the heavy lifting without timeout limits
    console.log(`🚀 Triggering Inngest content generation for: ${keywordText}`);
    
    try {
      await inngest.send({
        name: 'calendar/keyword.generate',
        data: {
          keywordId: keyword_id,
          keyword: keywordText,
          userId: user.id,
          relatedKeywords,
        },
      });

      console.log(`✅ Inngest event sent successfully for keyword: ${keywordText}`);

      return NextResponse.json({
        success: true,
        message: 'Content generation started',
        keyword: keywordText,
        keywordId: keyword_id,
        status: 'generating',
        note: 'Content is being generated in the background by Inngest. Check back in a few minutes. The content will auto-publish to your WordPress site when complete.'
      });
    } catch (inngestError) {
      console.error('❌ Error sending Inngest event:', inngestError);
      
      // Revert keyword status if Inngest fails
      if (keyword_id) {
        await supabase
          .from('discovered_keywords')
          .update({ generation_status: 'failed' })
          .eq('id', keyword_id);
      }

      return NextResponse.json(
        { error: 'Failed to start content generation. Please check Inngest configuration.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Content generation API error:', error);
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}
