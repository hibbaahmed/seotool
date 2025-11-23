import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { marked } from 'marked';
import { generateKeywordContentPrompt, generateExpansionPrompt } from '@/lib/content-generation-prompts';

// Helper function to add inline spacing styles to HTML
function addInlineSpacing(html: string): string {
  // Add inline styles to ensure proper spacing in WordPress
  // This ensures spacing works regardless of the WordPress theme's CSS
  
  // Preserve iframes and embeds first (extract them temporarily)
  const iframePlaceholders: string[] = [];
  // Match iframes including self-closing or with content - handle multiline
  const iframeRegex = /<iframe[^>]*>(?:.*?<\/iframe>|)/gis;
  const embedRegex = /<embed[^>]*\/?>/gis;
  const objectRegex = /<object[^>]*>.*?<\/object>/gis;
  
  // Extract iframes (including YouTube embeds)
  html = html.replace(iframeRegex, (match) => {
    if (match.trim()) {
      const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
      iframePlaceholders.push(match);
      return placeholder;
    }
    return match;
  });
  
  // Extract embeds
  html = html.replace(embedRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  // Extract objects
  html = html.replace(objectRegex, (match) => {
    const placeholder = `__IFRAME_PLACEHOLDER_${iframePlaceholders.length}__`;
    iframePlaceholders.push(match);
    return placeholder;
  });
  
  // Add spacing to paragraphs (1.5em top and bottom) - but not inside placeholders
  html = html.replace(/<p>/gi, '<p style="margin-top: 1.5em; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Add spacing to headings
  html = html.replace(/<h2>/gi, '<h2 style="margin-top: 2em; margin-bottom: 1em; font-weight: 700;">');
  html = html.replace(/<h3>/gi, '<h3 style="margin-top: 1.75em; margin-bottom: 0.875em; font-weight: 700;">');
  html = html.replace(/<h4>/gi, '<h4 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h5>/gi, '<h5 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h6>/gi, '<h6 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  
  // Add professional styling to tables
  html = html.replace(/<table>/gi, '<table style="margin-top: 2rem; margin-bottom: 2rem; width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); font-size: 15px; border: none;">');
  html = html.replace(/<thead>/gi, '<thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">');
  html = html.replace(/<th>/gi, '<th style="color: white; font-weight: 600; text-align: left; padding: 16px 20px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border: none;">');
  html = html.replace(/<td>/gi, '<td style="padding: 16px 20px; color: #374151; line-height: 1.6; border: none; border-bottom: 1px solid #e5e7eb;">');
  html = html.replace(/<tr>/gi, '<tr style="transition: background-color 0.2s ease;">');
  
  // Remove top margin from first paragraph
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Restore iframes and embeds
  iframePlaceholders.forEach((iframe, index) => {
    html = html.replace(`__IFRAME_PLACEHOLDER_${index}__`, iframe);
  });
  
  return html;
}

// POST /api/calendar/generate - Generate content for a keyword immediately
export async function POST(request: NextRequest) {
  try {
    // Check for server-side authentication (from Inngest/scheduled tasks)
    const serviceRoleKey = request.headers.get('x-supabase-service-role');
    const userIdHeader = request.headers.get('x-user-id');
    
    let supabase;
    let user;

    if (serviceRoleKey === process.env.SUPABASE_SERVICE_ROLE_KEY && userIdHeader) {
      // Server-side authentication (from Inngest)
      console.log('🔐 Using service role authentication for scheduled task');
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Verify user exists
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userIdHeader);
      if (userError || !userData.user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      user = userData.user;
    } else {
      // Regular user authentication
      supabase = await createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
    }

    const body = await request.json();
    const { keyword_id, keyword, content_type = 'blog post', target_audience, tone = 'professional', is_test = false } = body;

    if (!keyword_id && !keyword) {
      return NextResponse.json(
        { error: 'Either keyword_id or keyword text is required' },
        { status: 400 }
      );
    }

    // Both test and full generation require 1 credit
    const requiredCredits = 1;
    
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

    if (currentCredits < requiredCredits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${requiredCredits} credit(s) to generate content. You currently have ${currentCredits} credit(s).` },
        { status: 402 } // 402 Payment Required
      );
    }

    // Fetch user settings for content length preference
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('content_length')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const contentLength = (settingsData?.content_length || 'long') as 'short' | 'medium' | 'long';

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

    // Fetch related keywords from DataForSEO if available
    let primaryKeywords: string[] = [];
    let secondaryKeywords: string[] = [];
    let longTailKeywords: string[] = [];
    
    try {
      // Check if we have keyword_type data
      if (keywordData && (keywordData as any).keyword_type) {
        // Fetch related keywords from same group
        const { data: relatedData } = await supabase
          .from('discovered_keywords')
          .select('keyword, keyword_type, search_volume')
          .or(`parent_keyword_id.eq.${keyword_id},id.eq.${keyword_id}`)
          .order('search_volume', { ascending: false });
        
        if (relatedData && relatedData.length > 0) {
          relatedData.forEach((kw: any) => {
            if (kw.keyword_type === 'primary') {
              primaryKeywords.push(kw.keyword);
            } else if (kw.keyword_type === 'secondary') {
              secondaryKeywords.push(kw.keyword);
            } else if (kw.keyword_type === 'long-tail') {
              longTailKeywords.push(kw.keyword);
            }
          });
          
          console.log(`📊 Found keyword group:
  Primary: ${primaryKeywords.length}
  Secondary: ${secondaryKeywords.length}
  Long-tail: ${longTailKeywords.length}`);
        }
      }
      
      // If no classified keywords, try to fetch from DataForSEO
      if (primaryKeywords.length === 0 && secondaryKeywords.length === 0 && longTailKeywords.length === 0) {
        console.log('🔍 No classified keywords found, fetching from DataForSEO...');
        
        try {
          const { fetchKeywordsFromDataForSEO, saveKeywordsToDatabase } = await import('@/lib/dataforseo-keywords');
          
          const keywordSet = await fetchKeywordsFromDataForSEO(keywordText, 2840, {
            includeQuestions: true,
            includeRelated: true,
            maxResults: 30
          });
          
          // Extract keywords by type
          primaryKeywords = keywordSet.primary.map((k: any) => k.keyword);
          secondaryKeywords = keywordSet.secondary.map((k: any) => k.keyword).slice(0, 10);
          longTailKeywords = keywordSet.longTail.map((k: any) => k.keyword).slice(0, 15);
          
          // Save keywords to database for future use (if we have profile ID)
          if (keywordData && (keywordData as any).onboarding_profile_id) {
            await saveKeywordsToDatabase(
              keywordSet,
              (keywordData as any).onboarding_profile_id,
              user.id
            );
          }
          
          console.log(`✅ Fetched and saved DataForSEO keywords:
  Primary: ${primaryKeywords.length}
  Secondary: ${secondaryKeywords.length}
  Long-tail: ${longTailKeywords.length}`);
        } catch (dataForSeoError) {
          console.warn('⚠️ DataForSEO fetch failed, using related_keywords field:', dataForSeoError);
          // Fallback to related_keywords if available
          secondaryKeywords = keywordData ? ((keywordData as any).related_keywords || []) : [];
        }
      }
      
      // Ensure primary keyword is included
      if (!primaryKeywords.includes(keywordText)) {
        primaryKeywords.unshift(keywordText);
      }
      
    } catch (relatedError) {
      console.warn('⚠️ Error fetching related keywords:', relatedError);
      // Fallback to basic related keywords
      secondaryKeywords = keywordData ? ((keywordData as any).related_keywords || []) : [];
      if (!primaryKeywords.includes(keywordText)) {
        primaryKeywords = [keywordText];
      }
    }

    // Search for relevant images and upload to Supabase Storage BEFORE content generation
    let uploadedImageUrls: string[] = [];
    
    try {
      console.log('🔍 Searching for images for topic:', keywordText);
      
      // 1) Find candidate image URLs via Tavily or use demos
      let candidateImages: string[] = [];
      if (process.env.TAVILY_API_KEY) {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: keywordText,
            search_depth: 'basic',
            include_images: true,
            max_results: 5
          })
        });
        if (tavilyResponse.ok) {
          const tavilyData = await tavilyResponse.json();
          if (Array.isArray(tavilyData.images)) {
            candidateImages = tavilyData.images.filter(Boolean);
            console.log('🖼️ Found images from Tavily:', candidateImages.length);
          }
        }
      }

      // Use demo images if no images found
      if (candidateImages.length === 0) {
        candidateImages = [
          'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800'
        ];
      }

      // 2) Upload to Supabase storage for stable hosting
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const storage = createServiceClient(supabaseUrl, supabaseKey);

      console.log('📤 Starting image upload process for', candidateImages.length, 'images');

      for (let i = 0; i < Math.min(candidateImages.length, 5); i++) {
        const externalUrl = candidateImages[i];
        try {
          console.log(`🔄 Starting upload for image ${i + 1}:`, externalUrl);
          
          const resp = await fetch(externalUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
              'Referer': new URL(externalUrl).origin,
            },
            cache: 'no-store',
          });
          
          if (!resp.ok) {
            console.warn(`⚠️ Failed to fetch image ${i + 1}: ${resp.status}`);
            continue;
          }
          
          // Get content type from headers or infer from URL/blob
          let contentType = resp.headers.get('Content-Type') || '';
          
          // If no content type, try to infer from URL extension
          if (!contentType || contentType === 'application/octet-stream') {
            const urlPath = new URL(externalUrl).pathname.toLowerCase();
            if (urlPath.endsWith('.png')) {
              contentType = 'image/png';
            } else if (urlPath.endsWith('.gif')) {
              contentType = 'image/gif';
            } else if (urlPath.endsWith('.webp')) {
              contentType = 'image/webp';
            } else {
              contentType = 'image/jpeg'; // Default fallback
            }
          }
          
          const blob = await resp.blob();
          console.log(`📦 Image ${i + 1} blob size:`, blob.size, 'bytes', 'contentType:', contentType);
          
          // Validate blob type matches expected content type
          if (blob.type && blob.type !== contentType && blob.type !== 'application/octet-stream') {
            // Use blob's actual type if it's a valid image type
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            if (validImageTypes.includes(blob.type)) {
              contentType = blob.type;
              console.log(`📝 Using blob's actual type: ${contentType}`);
            }
          }
          
          // Ensure contentType is valid (not application/octet-stream)
          const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
          if (!validImageTypes.includes(contentType)) {
            console.warn(`⚠️ Invalid content type ${contentType}, defaulting to image/jpeg`);
            contentType = 'image/jpeg';
          }
          
          const id = `${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`;
          const typeToExt: Record<string, string> = { 
            'image/jpeg': 'jpg', 
            'image/jpg': 'jpg', 
            'image/png': 'png', 
            'image/webp': 'webp', 
            'image/gif': 'gif' 
          };
          const ext = typeToExt[contentType.toLowerCase()] || 'jpg';
          const path = `user_uploads/${user.id}/${id}.${ext}`;

          console.log(`📁 Uploading to path:`, path, 'with contentType:', contentType);

          const uploadRes = await storage.storage.from('photos').upload(path, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType: contentType, // Explicitly set valid content type
          });
          
          console.log(`📤 Upload result for image ${i + 1}:`, uploadRes);
          
          if (uploadRes.error) {
            console.error(`❌ Upload error for image ${i + 1}:`, uploadRes.error);
            continue;
          }
          
          const { data: pub } = storage.storage.from('photos').getPublicUrl(path);
          if (pub?.publicUrl) {
            uploadedImageUrls.push(pub.publicUrl);
            console.log(`✅ Image ${i + 1} uploaded successfully:`, pub.publicUrl);
          }
        } catch (err) {
          console.error(`❌ Error uploading image ${i + 1}:`, err);
          continue;
        }
      }
      
      console.log('📤 Upload process completed. Successfully uploaded:', uploadedImageUrls.length, 'images');
    } catch (fallbackErr) {
      console.warn('⚠️ Calendar image upload failed:', fallbackErr);
    }

    // Fetch user's business information for personalized CTA
    let businessName = 'our company';
    let websiteUrl = '';
    try {
      const { data: profileData } = await supabase
        .from('user_onboarding_profiles')
        .select('business_name, website_url')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        businessName = profileData.business_name || 'our company';
        websiteUrl = profileData.website_url || '';
        console.log(`✅ Using business name: ${businessName}`);
      }
    } catch (profileError) {
      console.warn('⚠️ Could not fetch business profile, using default:', profileError);
    }

    // Generate content using the content writer API with uploaded image URLs - OUTRANK STYLE
    // Use shared prompt function to avoid duplication
    const contentPrompt = generateKeywordContentPrompt({
      keyword: keywordText,
      primaryKeywords,
      secondaryKeywords,
      longTailKeywords,
      contentType: content_type,
      targetAudience: target_audience || 'General audience',
      tone,
      imageUrls: uploadedImageUrls,
      isTest: is_test, // Pass test mode flag to prompt generator
      businessName, // Pass business name for personalized CTA
      websiteUrl, // Pass website URL for CTA
      contentLength // Pass user's content length preference
    });

    // Call the content writer API to generate content
    // For test mode, disable multi-phase to generate shorter content faster
    // For full generation, enable multi-phase for longer, better structured content
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/content-writer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: contentPrompt }],
        userId: user.id,
        enableMultiPhase: !is_test, // Disable multi-phase for test mode (faster, shorter content)
        isTest: is_test, // Pass test mode flag to content-writer API
        businessName, // Pass business name for multi-phase generation
        websiteUrl, // Pass website URL for multi-phase generation
      }),
    });

    if (!contentResponse.ok) {
      throw new Error('Content generation failed');
    }

    // Stream the response and collect the full content
    let fullContent = '';
    let streamedImageUrls: string[] = [];
    let streamedVideos: Array<{ id: string; title?: string; url?: string }> = [];
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
                streamedImageUrls = data.urls;
              } else if (data.type === 'videos' && data.videos) {
                streamedVideos = Array.isArray(data.videos) ? data.videos : [];
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

    // Use the uploaded images as the final image URLs
    const finalImageUrls = uploadedImageUrls.length > 0 ? uploadedImageUrls : streamedImageUrls;
    const finalVideos = streamedVideos;

    // Remove boilerplate opening line like: "Here is a 2,700-word comprehensive ... blog post ..."
    fullContent = fullContent.replace(/^[\s>*]*Here is a [^\n]*?blog post[^\n]*?:\s*\n?/i, '');
    
    // Remove "Meta Description:" label ANYWHERE in content (not just at start)
    // This catches cases where it appears in the middle or at the start
    fullContent = fullContent.replace(/Meta Description:\s*[^\n]+/gi, '');
    fullContent = fullContent.replace(/\*\*Meta Description\*\*:?\s*[^\n]+/gi, '');
    fullContent = fullContent.replace(/\d+\.\s*\*\*Meta Description\*\*:?\s*[^\n]+/gi, '');
    
    // Remove "Title:" label ANYWHERE in content
    fullContent = fullContent.replace(/(?:^|\n)#\s+[^\n]*Meta Description[^\n]*/gi, '\n');
    fullContent = fullContent.replace(/(?:^|\n)Title:\s*[^\n]+/gi, '\n');
    fullContent = fullContent.replace(/\*\*Title\*\*:?\s*[^\n]+/gi, '');
    fullContent = fullContent.replace(/\d+\.\s*\*\*Title\*\*:?\s*[^\n]+/gi, '');
    
    // Remove when both appear together ANYWHERE
    fullContent = fullContent.replace(/Title:\s*[^M\n]+Meta Description:\s*[^\n]+/gi, '');
    
    // Remove broken/incomplete image tags
    fullContent = fullContent.replace(/<img\s+src="[^"]*(?:user_uploads\/\d+)?#[^"]*"[^>]*>/gi, '');
    fullContent = fullContent.replace(/<img\s+src="[^"]*"(?!\s*\/>|\s*>)[^>]*/gi, '');
    
    // Remove "Post-Processing and Enhancement" and similar section markers
    fullContent = fullContent.replace(/\n*(?:Post-Processing and Enhancement|Enhancement and Optimization|Processing Steps)\n*/gi, '\n');
    
    // Remove instruction markers that shouldn't be in content
    fullContent = fullContent.replace(/\n*#\s*Remaining H2 Sections?\n*/gi, '\n');
    fullContent = fullContent.replace(/\n*#\s*(?:Write|Add|Include)\s+[^\n]+\n*/gi, '\n');
    fullContent = fullContent.replace(/\n*\[(?:Write|Add|Include|Insert|Place)[^\]]*\]\n*/gi, '\n');
    
    // Remove orphaned table headers (tables with only header row, no data)
    // Pattern: | Header | Header | followed by |---|---| but no data rows
    fullContent = fullContent.replace(/\|[^|\n]+\|[^|\n]+\|[^\n]*\n\s*\|[-\s]+\|[-\s]+\|[^\n]*\n(?!\s*\|[^-\n])/gm, '');
    
    // Remove standalone table separator lines that got orphaned
    fullContent = fullContent.replace(/^\s*\|[-\s]+\|[-\s]+\|[^\n]*\n/gm, '');
    
    // Fix tables with paragraph text in table rows - extract and place after table
    // Pattern: table rows with single cells containing paragraph text (50+ chars, multiple sentences)
    fullContent = fullContent.replace(/(\n(?:\|[^\n]+\|\n)+)(\|\s*([A-Z][^|]{50,}[.!](?:\s+[A-Z][^|]+[.!])+[^|]*)\s*\|)\n/gm, (match, tableRows, rowWithText, textContent) => {
      // Extract the paragraph text and place it after the table
      const cleanText = textContent.trim();
      return `${tableRows}\n\n${cleanText}\n\n`;
    });
    
    // Remove instruction comments in brackets or parentheses
    fullContent = fullContent.replace(/\[(?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\]]*\]/gi, '');
    fullContent = fullContent.replace(/\((?:TODO|NOTE|PLACEHOLDER|EXAMPLE|REPLACE|FILL IN)[^\)]*\)/gi, '');

    // Expansion pass: if word count is too low, ask the writer to expand
    // Get minimum word count threshold based on content length preference
    const minWordThreshold = contentLength === 'short' ? 600 : contentLength === 'medium' ? 2000 : 3800;
    const plainWordCount = fullContent.replace(/[#>*_`|\[\]()*]/g, '').split(/\s+/).filter(Boolean).length;
    if (plainWordCount < minWordThreshold) {
      try {
        const maxWords = contentLength === 'short' ? 800 : contentLength === 'medium' ? 3000 : 4200;
        console.log(`✏️ Draft length ${plainWordCount} words < ${minWordThreshold}. Requesting expansion to ${minWordThreshold}-${maxWords} words (${contentLength})...`);
        // Use shared expansion prompt function
        const expansionPrompt = generateExpansionPrompt(fullContent, businessName, websiteUrl, contentLength);

        const expandRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/content-writer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: expansionPrompt }], 
            userId: user.id,
            enableMultiPhase: false, // Use single-phase for expansion to avoid duplicate phases
            businessName, // Pass business name for expansion
            websiteUrl // Pass website URL for expansion
          })
        });

        if (expandRes.ok && expandRes.body) {
          const reader2 = expandRes.body.getReader();
          const decoder2 = new TextDecoder();
          let expanded = '';
          while (true) {
            const { done, value } = await reader2.read();
            if (done) break;
            const chunk = decoder2.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'token' && data.value) expanded += data.value;
                } catch {}
              }
            }
          }
          if (expanded && expanded.length > fullContent.length) {
            fullContent = expanded;
            console.log('✅ Expansion applied');
          }
        } else {
          console.warn('⚠️ Expansion request failed');
        }
      } catch (expErr) {
        console.warn('⚠️ Expansion pass error:', expErr);
      }
    }

    // Ensure at least one YouTube video embed if available and none present
    try {
      const hasIframe = /<iframe\s[^>]*src="https:\/\/www\.youtube\.com\/embed\//i.test(fullContent);
      if (!hasIframe && finalVideos && finalVideos.length > 0) {
        const first = finalVideos[0] as any;
        const videoId = first?.id || (first?.url ? String(first.url).split('v=')[1]?.split('&')[0] : '');
        if (videoId) {
          const iframeHtml = `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n\n`;
          const firstH2Idx = fullContent.search(/\n##\s+[^\n]+/);
          if (firstH2Idx !== -1) {
            const h2End = fullContent.indexOf('\n', firstH2Idx + 1);
            const insertAt = h2End !== -1 ? h2End + 1 : fullContent.length;
            fullContent = fullContent.slice(0, insertAt) + iframeHtml + fullContent.slice(insertAt);
            console.log('🎥 Inserted fallback YouTube iframe after first H2');
          } else {
            const firstParaMatch = fullContent.match(/^(.+?)(\n\n|$)/s);
            if (firstParaMatch && typeof firstParaMatch.index === 'number') {
              const insertAt = firstParaMatch[0].length;
              fullContent = fullContent.slice(0, insertAt) + iframeHtml + fullContent.slice(insertAt);
              console.log('🎥 Inserted fallback YouTube iframe after intro');
            } else {
              fullContent += iframeHtml;
              console.log('🎥 Appended fallback YouTube iframe at end');
            }
          }
        }
      }
    } catch (videoInsertErr) {
      console.warn('⚠️ Failed to insert fallback YouTube iframe:', videoInsertErr);
    }

    // Post-process content: normalize spacing and placeholders (no in-article TOC)
    try {
      const { processContentPlaceholders, normalizeContentSpacing } = await import('@/lib/process-content-placeholders');

      // Process any remaining placeholders
      fullContent = processContentPlaceholders(fullContent, finalImageUrls);

      // Normalize spacing for better readability
      fullContent = normalizeContentSpacing(fullContent);

      // Remove any in-article Table of Contents sections if present
      fullContent = fullContent.replace(/\n##\s*Table of Contents[\s\S]*?(?=\n##\s|$)/gmi, '\n');
      // Remove standalone '##' lines
      fullContent = fullContent.replace(/^\s*##\s*$/gmi, '');
      // Remove Key Takeaways sections entirely
      fullContent = fullContent.replace(/\n(?:##\s*)?Key Takeaways:?\s*[\s\S]*?(?=\n##\s|$)/gmi, '\n');
      // Remove [Call-to-Action]: placeholder lines
      fullContent = fullContent.replace(/^\s*\[Call-to-Action\]:.*$/gmi, '');
      // Clean up H3 headings with bold markdown (### **Text** -> ### Text)
      fullContent = fullContent.replace(/^###\s+\*\*(.+?)\*\*\s*$/gmi, '### $1');
      // Also clean H2 headings with bold (## **Text** -> ## Text)
      fullContent = fullContent.replace(/^##\s+\*\*(.+?)\*\*\s*$/gmi, '## $1');

      console.log('✨ Content post-processing complete (placeholders, spacing, TOC removed)');
    } catch (processError) {
      console.warn('⚠️ Content post-processing failed (continuing anyway):', processError);
    }

    // Clean up broken/malformed image markdown
    // Remove incomplete image URLs (like those with &#8230; or truncated URLs)
    fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*https?:\/\/[^\s\)]*&#8230[^\s\)]*\)/gi, '');
    fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*https?:\/\/[^\s\)]*\.\.\.[^\s\)]*\)/gi, '');
    fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*publi[^)]*\)/gi, '');
    // Remove image markdown with incomplete URLs ending with ; or spaces
    fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*\s+;?\s*\)/gi, '');
    // Remove any image markdown that has an incomplete URL (contains special chars that shouldn't be in URLs)
    fullContent = fullContent.replace(/!\[[^\]]*\]\(\s*[^)]*[;&#][^)]*\)/gi, '');

    // Verify images are embedded in the content markdown
    // If not embedded, the content-writer should have done it, but double-check
    const hasEmbeddedImages = /!\[.*?\]\([^)]+\)/.test(fullContent);
    
    if (!hasEmbeddedImages && finalImageUrls && finalImageUrls.length > 0) {
      console.log('⚠️ No embedded images detected in body, manually embedding...');
      
      let insertPosition = 0;
      const titleMatch = fullContent.match(/#\s+[^\n]+\n\n/);
      if (titleMatch) {
        insertPosition = titleMatch.index! + titleMatch[0].length;
      }

      const afterTitle = fullContent.substring(insertPosition);
      const firstParagraphMatch = afterTitle.match(/^(.+?)(\n\n|$)/s);
      const imageInsertPosition = firstParagraphMatch
        ? insertPosition + firstParagraphMatch[1].length
        : insertPosition;

      const firstImageMarkdown = `\n\n![${keywordText}](${finalImageUrls[0]})\n\n`;
      fullContent =
        fullContent.slice(0, imageInsertPosition) +
        firstImageMarkdown +
        fullContent.slice(imageInsertPosition);

      if (finalImageUrls.length > 1) {
        const searchStart = imageInsertPosition + firstImageMarkdown.length;
        const h2Pattern = /^##\s+[^\n]+$/gm;
        const h2Matches: RegExpMatchArray[] = [];
        let match;
        const searchContent = fullContent.substring(searchStart);

        while ((match = h2Pattern.exec(searchContent)) !== null) {
          h2Matches.push(match);
        }

        if (h2Matches.length > 0) {
          const imagesToPlace = Math.min(finalImageUrls.length - 1, h2Matches.length);
          const spacing = Math.max(1, Math.floor(h2Matches.length / imagesToPlace));
          let addedLength = 0;

          for (let i = 0; i < imagesToPlace && i + 1 < finalImageUrls.length; i++) {
            const h2Index = Math.min((i + 1) * spacing - 1, h2Matches.length - 1);
            const h2Match = h2Matches[h2Index];

            if (h2Match && h2Match.index !== undefined) {
              const h2GlobalPos = searchStart + addedLength + h2Match.index + h2Match[0].length;
              const afterH2 = fullContent.substring(h2GlobalPos);
              const paraMatch = afterH2.match(/^(.+?)(\n\n|$)/s);

              if (paraMatch) {
                const imgPos = h2GlobalPos + paraMatch[1].length;
                const imgMarkdown = `\n\n![${keywordText} - Image ${i + 2}](${finalImageUrls[i + 1]})\n\n`;
                fullContent = fullContent.slice(0, imgPos) + imgMarkdown + fullContent.slice(imgPos);
                addedLength += imgMarkdown.length;
              }
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
        image_urls: finalImageUrls,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated content:', saveError);
      // If content couldn't be saved, don't deduct credits and return error
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      );
    }

    if (!savedContent) {
      return NextResponse.json(
        { error: 'Content generation completed but content was not saved' },
        { status: 500 }
      );
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

    // CRITICAL: Deduct credits immediately after successful content generation
    // Credits are deducted for generation, not publishing (user pays for content generation)
    const serviceSupabaseForCredits = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { error: deductError } = await serviceSupabaseForCredits
      .from('credits')
      .update({ credits: currentCredits - requiredCredits })
      .eq('user_id', user.id);

    if (deductError) {
      console.error('⚠️ CRITICAL: Content generated successfully but failed to deduct credits:', deductError);
      // Log error but don't fail - content was already generated and saved
    } else {
      console.log(`✅ Deducted ${requiredCredits} credit(s) from user ${user.id} for ${is_test ? 'test' : 'full'} blog post generation. Remaining: ${currentCredits - requiredCredits}`);
    }

    let publishingSucceeded = false;

    // Auto-publish to user's connected WordPress site if available
    try {
      const { data: site } = await serviceSupabase
        .from('wordpress_sites')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (site) {
        // Extract title from content_output - prioritize generated title over keyword
        const contentOutput = fullContent || '';
        let extractedTitle = null;
        
        // Priority 1: Extract from Title section with comprehensive patterns
        const titlePatterns = [
          /(?:^|\n)\d+\.\s*\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
          /(?:^|\n)\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
          /(?:^|\n)1\.\s*\*\*Title\*\*[:\s]*\n\s*([^\n]+?)(?:\n|$)/i,
          /(?:^|\n)Title:\s*"?([^"\n]+?)"?\s*(?:\n|$)/i,
          /(?:^|\n)\*\*Title\*\*:\s*([^\n]+?)(?:\n|$)/i,
          /Title[:\s]+\*\*([^\n]+?)\*\*/i,
          /Title[:\s]+"([^"]+?)"/i,
          /Title[:\s]+'([^']+?)'/i
        ];
        
        for (const pattern of titlePatterns) {
          const match = contentOutput.match(pattern);
          if (match && match[1]) {
            const candidate = match[1].trim().replace(/^["']|["']$/g, '').replace(/^\*\*|\*\*$/g, '');
            // Validate: title should be meaningful (not just "Title" or the keyword)
            if (candidate.length > 5 && candidate.toLowerCase() !== 'title' && candidate.toLowerCase() !== keywordText.toLowerCase()) {
              extractedTitle = candidate;
              break;
            }
          }
        }
        
        // Priority 2: Extract from H1 in content section (after "Content" marker)
        if (!extractedTitle) {
          const contentSectionMatch = contentOutput.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/i);
          if (contentSectionMatch) {
            const afterContent = contentOutput.substring(contentSectionMatch.index! + contentSectionMatch[0].length);
            const h1Match = afterContent.match(/^#\s+([^\n]+)/m);
            if (h1Match && h1Match[1]) {
              const h1Title = h1Match[1].trim();
              // Validate: should be a real title, not section markers
              if (h1Title.length > 5 && 
                  !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction)/i) &&
                  h1Title.toLowerCase() !== keywordText.toLowerCase()) {
                extractedTitle = h1Title;
              }
            }
          }
        }
        
        // Priority 3: Try to find any H1 in the content
        if (!extractedTitle) {
          const h1Patterns = [
            /(?:^|\n)#\s+([^\n]+?)(?:\n|$)/gm,
            /#\s+([^\n]+?)(?:\n|$)/gm
          ];
          for (const pattern of h1Patterns) {
            const matches = [...contentOutput.matchAll(pattern)];
            for (const match of matches) {
              if (match && match[1]) {
                const h1Title = match[1].trim();
                if (h1Title.length > 5 && 
                    !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction|\d+\.)/i) &&
                    h1Title.toLowerCase() !== keywordText.toLowerCase()) {
                  extractedTitle = h1Title;
                  break;
                }
              }
            }
            if (extractedTitle) break;
          }
        }
        
        // Final fallback: use keyword only if absolutely no title found
        if (!extractedTitle) {
          extractedTitle = keywordText;
          console.warn(`⚠️ Could not extract title from content, using keyword: ${keywordText}`);
        } else {
          console.log(`✅ Extracted title: ${extractedTitle}`);
        }
        
        // Extract and clean content (same logic as extractContentFromAIOutput)
        let cleaned = contentOutput;
        
        // Remove numbered sections
        cleaned = cleaned.replace(/^\d+\.?\s*\*\*Title\*\*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*Title:.*$/gmi, '');
        cleaned = cleaned.replace(/^\*\*Title\*\*[:\s]*.*$/gmi, '');
        cleaned = cleaned.replace(/^Title:\s*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*\*\*Meta Description\*\*.*$/gmi, '');
        cleaned = cleaned.replace(/^\d+\.?\s*Meta Description:.*$/gmi, '');
        cleaned = cleaned.replace(/^\*\*Meta Description\*\*[:\s]*.*$/gmi, '');
        cleaned = cleaned.replace(/^Meta Description:\s*.*$/gmi, '');
        
        // Remove "Title:" and "Meta Description:" when they appear together on same line
        cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
        cleaned = cleaned.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
        
        // Remove any remaining "Title:" or "Meta Description:" anywhere in content (not just start of line)
        cleaned = cleaned.replace(/(?:^|\n)\s*Title:\s*[^\n]+/gim, '');
        cleaned = cleaned.replace(/(?:^|\n)\s*Meta Description:\s*[^\n]+/gim, '');
        
        // Extract Content section
        const contentPatterns = [
          /(?:^|\n)\d+\.?\s*\*\*Content\*\*[:\s]*\n?(.*)$/is,
          /(?:^|\n)\*\*Content\*\*[:\s]*\n?(.*)$/is,
          /(?:^|\n)3\.\s+\*\*Content\*\*[:\s]*\n?(.*)$/is
        ];
        
        let extractedContent = '';
        for (const pattern of contentPatterns) {
          const match = cleaned.match(pattern);
          if (match && match[1]) {
            extractedContent = match[1];
            break;
          }
        }
        
        if (!extractedContent) {
          extractedContent = cleaned;
        }
        
        // Remove duplicate titles at the start (H1 format, plain text, or multiple occurrences)
        const lines = extractedContent.split('\n');
        let startIndex = 0;
        let foundFirstTitle = false;
        const foundTitles: string[] = [];
        
        // First pass: identify all title-like patterns at the start
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          const line = lines[i].trim();
          
          // Check for H1 format: # Title
          if (line.match(/^#\s+.+$/)) {
            const titleText = line.replace(/^#\s+/, '').trim();
            if (!foundFirstTitle) {
              foundFirstTitle = true;
              foundTitles.push(titleText);
              startIndex = i + 1;
            } else {
              // Check if this is a duplicate of the first title
              if (foundTitles.length > 0 && (titleText === foundTitles[0] || titleText.toLowerCase() === foundTitles[0].toLowerCase())) {
                startIndex = i + 1;
                continue;
              }
              // If it's a different title but still looks like a title, skip it too
              if (titleText.length > 10 && titleText.length < 100) {
                startIndex = i + 1;
                continue;
              }
            }
          }
          // Check for plain text titles (standalone lines that look like titles)
          else if (line && !line.startsWith('#') && !line.match(/^\d+\./) && !line.startsWith('*')) {
            // If it's a short line that looks like a title (not a paragraph)
            if (line.length > 10 && line.length < 150 && !line.includes('. ') && !line.match(/^[a-z]/)) {
              // Check if it's a duplicate
              if (foundTitles.length > 0 && (line === foundTitles[0] || line.toLowerCase() === foundTitles[0].toLowerCase())) {
                startIndex = i + 1;
                continue;
              }
              // If we haven't found first title yet and this looks like one, mark it
              if (!foundFirstTitle && line.length < 100) {
                foundTitles.push(line);
                foundFirstTitle = true;
                startIndex = i + 1;
                continue;
              }
            }
            // If we hit actual paragraph content (starts with lowercase or has sentence structure), stop
            if (line.length > 50 || line.match(/^[a-z]/) || line.includes('. ')) {
              break;
            }
          }
        }
        
        // Skip blank lines after titles
        while (startIndex < lines.length && lines[startIndex].trim() === '') {
          startIndex++;
        }
        
        extractedContent = lines.slice(startIndex).join('\n');
        
        // Remove remaining numbered sections
        extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
        extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
        
        // Remove "Title:" and "Meta Description:" when they appear together or separately
        extractedContent = extractedContent.replace(/Title:\s*[^M]+Meta Description:\s*[^\n]+/gi, '');
        extractedContent = extractedContent.replace(/(?:^|\n)\s*Title:\s*[^\n]+/gim, '');
        extractedContent = extractedContent.replace(/(?:^|\n)\s*Meta Description:\s*[^\n]+/gim, '');
        
        // Remove "Internal link anchor ideas" section and image suggestions at the end
        // Match from "Internal link anchor ideas:" to the end, or from any "Internal link" mention
        extractedContent = extractedContent.replace(/\n*\n?Internal link anchor ideas:[\s\S]*$/gmi, '');
        extractedContent = extractedContent.replace(/\n*\n?Image suggestions?:[\s\S]*$/gmi, '');
        // Remove any remaining "Internal link" mentions
        extractedContent = extractedContent.replace(/\n*\n?Internal link[^:]*:[\s\S]*$/gmi, '');

        // Remove any SEO Suggestions sections anywhere
        extractedContent = extractedContent.replace(/\n+SEO Suggestions:?[\s\S]*$/gmi, '');
        // Remove Key Takeaways sections entirely
        extractedContent = extractedContent.replace(/\n(?:##\s*)?Key Takeaways:?\s*[\s\S]*?(?=\n##\s|$)/gmi, '\n');
        // Remove [Call-to-Action]: placeholder lines
        extractedContent = extractedContent.replace(/^\s*\[Call-to-Action\]:.*$/gmi, '');

        // Remove any Table of Contents blocks
        extractedContent = extractedContent.replace(/\n##\s*Table of Contents[\s\S]*?(?=\n##\s|$)/gmi, '\n');

        // Remove trailing quoted keyword bullet lists (e.g., – "AI video creation") at the end
        extractedContent = extractedContent.replace(/\n(?:\s*[–\-]\s*["'“][^"'”]+["'”]\s*\n?)+\s*$/g, '\n');

        // Remove standalone '##' lines
        extractedContent = extractedContent.replace(/^\s*##\s*$/gmi, '');
        
        // Clean up H3 headings with bold markdown (### **Text** -> ### Text)
        extractedContent = extractedContent.replace(/^###\s+\*\*(.+?)\*\*\s*$/gmi, '### $1');
        // Also clean H2 headings with bold (## **Text** -> ## Text)
        extractedContent = extractedContent.replace(/^##\s+\*\*(.+?)\*\*\s*$/gmi, '## $1');
        
        // Remove repetitive content after conclusion, but preserve FAQ sections
        // Find the conclusion heading
        const conclusionRegex = /(?:^|\n)##\s+Conclusion\s*\n/i;
        const conclusionMatch = extractedContent.match(conclusionRegex);
        
        // Check if there's an FAQ section after conclusion (can be H2 header or Q: format)
        const faqRegex = /(?:^|\n)(?:##\s+(?:FAQ|Frequently Asked Questions|Common Questions)\s*\n|Q:\s)/i;
        const faqMatch = extractedContent.match(faqRegex);
        
        if (conclusionMatch && conclusionMatch.index !== undefined) {
          const conclusionStart = conclusionMatch.index;
          const afterConclusionStart = conclusionStart + conclusionMatch[0].length;
          
          // If there's an FAQ section after conclusion, preserve it completely
          if (faqMatch && faqMatch.index !== undefined && faqMatch.index > conclusionStart) {
            // Keep everything from conclusion through FAQ - don't truncate FAQ content
            // Only remove repetitive boilerplate content between conclusion and FAQ
            const betweenConclusionAndFAQ = extractedContent.substring(afterConclusionStart, faqMatch.index);
            
            // Remove repetitive boilerplate sentences between conclusion and FAQ
            const cleanedBetween = betweenConclusionAndFAQ.replace(/(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?=\n|$)/gmi, '');
            
            // Reconstruct: everything before conclusion + conclusion header + cleaned content + FAQ onwards
            extractedContent = extractedContent.substring(0, afterConclusionStart) + cleanedBetween + extractedContent.substring(faqMatch.index);
          } else {
            // No FAQ section, clean up repetitive content after conclusion (keep conclusion paragraphs)
            const afterConclusion = extractedContent.substring(afterConclusionStart);
            
            // Find paragraphs in conclusion
            const paragraphMatches = afterConclusion.match(/.+?(?=\n\n|\n##\s|$)/gs) || [];
            
            // Keep all substantial conclusion paragraphs (up to 5), but remove repetitive boilerplate
            let keptContent = '';
            let paragraphCount = 0;
            for (const paraText of paragraphMatches) {
              if (paraText && paraText.trim().length > 20) {
                // Check if this paragraph is repetitive boilerplate
                const isRepetitive = /^(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)/i.test(paraText.trim());
                if (!isRepetitive || paragraphCount < 3) {
                  // Keep non-repetitive paragraphs, or allow up to 3 even if repetitive
                  keptContent += (keptContent ? '\n\n' : '') + paraText.trim();
                  paragraphCount++;
                  if (paragraphCount >= 5) break; // Keep up to 5 paragraphs
                }
              }
            }
            
            // If we have kept content, replace conclusion section
            if (keptContent) {
              extractedContent = extractedContent.substring(0, afterConclusionStart) + keptContent;
            } else {
              // Fallback: keep first 3 paragraphs regardless
              let conclusionEnd = conclusionStart + conclusionMatch[0].length;
              for (let i = 0; i < Math.min(3, paragraphMatches.length); i++) {
                const paraText = paragraphMatches[i];
                if (paraText && paraText.trim().length > 20) {
                  const paraIndex = afterConclusion.indexOf(paraText);
                  if (paraIndex !== -1) {
                    conclusionEnd = afterConclusionStart + paraIndex + paraText.length;
                  }
                }
              }
              extractedContent = extractedContent.substring(0, conclusionEnd).trim();
            }
            
            // Final cleanup: Remove any remaining repetitive bullet-like sentences (but preserve FAQ if it exists later)
            extractedContent = extractedContent.replace(/\n(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?=\n|$)/gi, '');
          }
        }
        
        // Remove trailing sections
        const stopKeywords = [
          '\n4. **SEO Suggestions',
          '\n**SEO Suggestions**',
          '\n## SEO Suggestions',
          '\n4. **Image Suggestions',
          '\n**Image Suggestions**',
          '\n## Image Suggestions',
          '\n5. **Call-to-Action',
          '\n**Call-to-Action**',
          '\n## Call-to-Action'
        ];
        for (const stopKeyword of stopKeywords) {
          const index = extractedContent.indexOf(stopKeyword);
          if (index !== -1) {
            extractedContent = extractedContent.substring(0, index);
            break;
          }
        }
        
        // Clean up whitespace
        extractedContent = extractedContent
          .replace(/\n{3,}/g, '\n\n')
          .replace(/^\s+/gm, '')
          .trim();
        
        // Apply paragraph spacing
        const linesArray = extractedContent.split('\n');
        const spacedLines: string[] = [];
        
        for (let i = 0; i < linesArray.length; i++) {
          const currentLine = linesArray[i];
          const currentTrimmed = currentLine.trim();
          
          spacedLines.push(currentLine);
          
          if (i < linesArray.length - 1) {
            const nextLine = linesArray[i + 1];
            const nextTrimmed = nextLine.trim();
            
            if (!currentTrimmed) {
              continue;
            }
            
            const isCurrentParagraph = currentTrimmed && 
                !currentTrimmed.startsWith('#') &&
                !currentTrimmed.startsWith('![') &&
                !currentTrimmed.startsWith('>') &&
                !currentTrimmed.startsWith('|') &&
                !currentTrimmed.startsWith('- ') &&
                !currentTrimmed.startsWith('* ') &&
                !/^\d+\.\s/.test(currentTrimmed);
            
            const isNextParagraph = nextTrimmed &&
                !nextTrimmed.startsWith('#') &&
                !nextTrimmed.startsWith('![') &&
                !nextTrimmed.startsWith('>') &&
                !nextTrimmed.startsWith('|') &&
                !nextTrimmed.startsWith('- ') &&
                !nextTrimmed.startsWith('* ') &&
                !/^\d+\.\s/.test(nextTrimmed);
            
            if (isCurrentParagraph && isNextParagraph) {
              let hasBlankLine = false;
              for (let j = i + 1; j < linesArray.length && j <= i + 2; j++) {
                if (!linesArray[j].trim()) {
                  hasBlankLine = true;
                  break;
                }
                if (linesArray[j].trim() && 
                    (linesArray[j].trim().startsWith('#') || 
                     linesArray[j].trim().startsWith('![') ||
                     linesArray[j].trim().startsWith('>') ||
                     linesArray[j].trim().startsWith('|') ||
                     linesArray[j].trim().startsWith('- ') ||
                     linesArray[j].trim().startsWith('* ') ||
                     /^\d+\.\s/.test(linesArray[j].trim()))) {
                  break;
                }
              }
              
              if (!hasBlankLine) {
                spacedLines.push('');
              }
            }
          }
        }
        
        extractedContent = spacedLines.join('\n');
        extractedContent = extractedContent.replace(/\n{3,}/g, '\n\n');

        // Remove boilerplate opening like: "Here is a 2,700-word comprehensive ... blog post ..."
        extractedContent = extractedContent.replace(/^[\s>*]*Here is a [^\n]*?blog post[^\n]*?:\s*\n?/i, '');
        
        // Remove duplicate H1 lines equal to the extracted title
        if (extractedTitle) {
          const esc = extractedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          extractedContent = extractedContent.replace(new RegExp(`^#\\s+${esc}\\s*$`, 'gmi'), '');
        }
        
        // Convert markdown to HTML with proper table handling
        const { 
          convertMarkdownTablesToHtml, 
          convertHtmlPipeTablesToHtml, 
          ensureWordPressTableStyles,
          stripLeadingHeading
        } = await import('@/lib/wordpress/content-formatting');
        
        // Strip leading heading first (title is already extracted)
        let contentForConversion = stripLeadingHeading(extractedContent);
        
        // Convert markdown tables to HTML before parsing
        contentForConversion = convertMarkdownTablesToHtml(contentForConversion);
        
        // Parse markdown to HTML
        let htmlContent = marked.parse(contentForConversion, { async: false }) as string;
        
        // Convert any remaining pipe tables that were wrapped in <p> tags
        htmlContent = convertHtmlPipeTablesToHtml(htmlContent);
        
        // Ensure all tables have proper WordPress styling
        htmlContent = ensureWordPressTableStyles(htmlContent);
        
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="width: 100%; height: auto; margin: 2rem 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" loading="lazy" />');
        }
        // Add inline spacing styles
        htmlContent = addInlineSpacing(htmlContent);
        
        // Add automatic internal links to content before publishing
        try {
          const { addInternalLinksToContent } = await import('@/lib/add-links-to-content');
          console.log('🔗 Attempting to add internal links to content...');
          const { linkedContent, linksAdded } = await addInternalLinksToContent(
            htmlContent,
            extractedTitle
          );
          if (linksAdded > 0) {
            console.log(`✅ Successfully added ${linksAdded} internal links`);
            htmlContent = linkedContent;
          } else {
            console.log('⚠️ No links were added (no similar posts found or no matches)');
          }
        } catch (linkError) {
          console.error('⚠️ Failed to add internal links (continuing anyway):', linkError);
          // Continue without links if linking fails
        }
        
        // Add automatic external links to authoritative sources based on article content
        try {
          const { addExternalLinksToContent } = await import('@/lib/add-links-to-content');
          console.log('🌐 Attempting to add contextual external links to content...');
          const { linkedContent: externalLinkedContent, linksAdded: externalLinksAdded } = await addExternalLinksToContent(
            htmlContent,
            extractedTitle,
            2 // Add up to 2 external links
          );
          if (externalLinksAdded > 0) {
            console.log(`✅ Successfully added ${externalLinksAdded} contextual external links`);
            htmlContent = externalLinkedContent;
          } else {
            console.log('⚠️ No external links were added');
          }
        } catch (externalLinkError) {
          console.error('⚠️ Failed to add external links (continuing anyway):', externalLinkError);
          // Continue without external links if linking fails
        }
        
        // Add strategic business promotion mentions throughout the article
        try {
          const { addBusinessPromotionToContent } = await import('@/lib/add-links-to-content');
          console.log('💼 Attempting to add business promotion mentions...');
          const { linkedContent: promotedContent, mentionsAdded } = await addBusinessPromotionToContent(
            htmlContent,
            user.id,
            3 // Add up to 3 business mentions
          );
          if (mentionsAdded > 0) {
            console.log(`✅ Successfully added ${mentionsAdded} business promotion mentions`);
            htmlContent = promotedContent;
          } else {
            console.log('⚠️ No business mentions were added');
          }
        } catch (promotionError) {
          console.error('⚠️ Failed to add business promotion (continuing anyway):', promotionError);
          // Continue without business promotion if it fails
        }
        
        const provider = (site as any).provider || ((site as any).access_token ? 'wpcom' : 'wordpress');
        const adapter = getAdapter(provider, {
          accessToken: (site as any).access_token,
          siteId: (site as any).site_id,
          url: (site as any).url,
          username: (site as any).username,
          password: (site as any).password,
          postType: (site as any).post_type,
        });
        
        const excerpt = extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...';
        const publishResult = await adapter.publish({
          title: extractedTitle,
          html: htmlContent,
          excerpt,
          tags: ['ai-generated', 'seotool'],
          imageUrl: finalImageUrls && finalImageUrls.length > 0 ? finalImageUrls[0] : undefined,
        });
        
        console.log('✅ Calendar content auto-published to WordPress:', publishResult);
        publishingSucceeded = true;
      }
    } catch (autoPublishError) {
      // CRITICAL: Publishing failed - throw error to prevent credit deduction
      console.error('❌ Auto-publish FAILED:', autoPublishError);
      
      // Delete the saved content since publishing failed
      try {
        await serviceSupabase
          .from('content_writer_outputs')
          .delete()
          .eq('id', savedContent.id);
        console.log('🗑️ Deleted saved content due to publishing failure');
      } catch (deleteError) {
        console.error('⚠️ Failed to delete saved content:', deleteError);
      }
      
      // Update keyword status back to 'none'
      if (keyword_id) {
        await supabase
          .from('discovered_keywords')
          .update({ 
            generation_status: 'failed',
            generated_content_id: null,
          })
          .eq('id', keyword_id);
      }
      
      // Throw error to prevent credit deduction and inform user
      throw new Error(`WordPress publishing failed after ${3} retry attempts. Please try again. Error: ${autoPublishError instanceof Error ? autoPublishError.message : String(autoPublishError)}`);
    }
    
    // Credits are already deducted after content generation (see above)
    // Publishing status is tracked for logging purposes only

    return NextResponse.json({
      success: true,
      content_id: savedContent?.id,
      content: fullContent,
      image_urls: finalImageUrls,
    });
  } catch (error) {
    console.error('Content generation API error:', error);
    
    // Update keyword status to failed if applicable
    try {
      const body = await request.json();
      if (body.keyword_id) {
        const supabase = await createClient();
        await supabase
          .from('discovered_keywords')
          .update({ generation_status: 'failed' })
          .eq('id', body.keyword_id);
      }
    } catch (e) {
      // Ignore error handling errors
    }
    
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}