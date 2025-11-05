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
      imageUrls: uploadedImageUrls
    });

    // Call the content writer API to generate content with multi-phase enabled
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/content-writer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: contentPrompt }],
        userId: user.id,
        enableMultiPhase: true, // Enable multi-phase for longer, better structured content
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

    // Expansion pass: if word count is too low, ask the writer to expand
    const plainWordCount = fullContent.replace(/[#>*_`|\[\]()*]/g, '').split(/\s+/).filter(Boolean).length;
    if (plainWordCount < 6000) {
      try {
        console.log(`✏️ Draft length ${plainWordCount} words < 6000. Requesting expansion to 6,000-8,500 words...`);
        // Use shared expansion prompt function
        const expansionPrompt = generateExpansionPrompt(fullContent);

        const expandRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai/content-writer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: expansionPrompt }], 
            userId: user.id,
            enableMultiPhase: false // Use single-phase for expansion to avoid duplicate phases
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

    // Verify images are embedded in the content markdown
    // If not embedded, the content-writer should have done it, but double-check
    const hasEmbeddedImages = /!\[.*?\]\([^)]+\)/.test(fullContent);
    
    if (!hasEmbeddedImages && finalImageUrls && finalImageUrls.length > 0) {
      console.log('⚠️ No embedded images detected, manually embedding...');
      
      // Find the Content section after the main title
      const contentStartMatch = fullContent.match(/#\s+[^\n]+\n\n/);
      if (contentStartMatch) {
        let insertPosition = contentStartMatch.index! + contentStartMatch[0].length;
        
        // Find the end of the first paragraph to insert image after
        const afterTitle = fullContent.substring(insertPosition);
        const firstParagraphMatch = afterTitle.match(/^(.+?)(\n\n|$)/s);
        
        if (firstParagraphMatch) {
          insertPosition += firstParagraphMatch[1].length;
          
          // Insert first image after intro paragraph
          const imageMarkdown = `\n\n![${keywordText}](${finalImageUrls[0]})\n\n`;
          fullContent = fullContent.slice(0, insertPosition) + imageMarkdown + fullContent.slice(insertPosition);
          
          // Find H2 headings and insert remaining images after some of them
          const h2Pattern = /^##\s+[^\n]+$/gm;
          const h2Matches: RegExpMatchArray[] = [];
          let match;
          const searchContent = fullContent.substring(insertPosition);
          
          while ((match = h2Pattern.exec(searchContent)) !== null) {
            h2Matches.push(match);
          }
          
          // Insert remaining images after H2 headings (distribute evenly)
          if (h2Matches.length > 0 && finalImageUrls.length > 1) {
            const imagesToPlace = Math.min(finalImageUrls.length - 1, h2Matches.length);
            const spacing = Math.max(1, Math.floor(h2Matches.length / imagesToPlace));
            
            for (let i = 0; i < imagesToPlace && i + 1 < finalImageUrls.length; i++) {
              const h2Index = Math.min((i + 1) * spacing - 1, h2Matches.length - 1);
              const h2Match = h2Matches[h2Index];
              
              if (h2Match && h2Match.index !== undefined) {
                // Find position after this H2 heading's first paragraph
                const h2GlobalPos = insertPosition + h2Match.index + h2Match[0].length;
                const afterH2 = fullContent.substring(h2GlobalPos);
                const paraMatch = afterH2.match(/^(.+?)(\n\n|$)/s);
                
                if (paraMatch) {
                  const imgPos = h2GlobalPos + paraMatch[1].length;
                  const imgMarkdown = `\n\n![${keywordText} - Image ${i + 2}](${finalImageUrls[i + 1]})\n\n`;
                  fullContent = fullContent.slice(0, imgPos) + imgMarkdown + fullContent.slice(imgPos);
                  // Update insert position offset since we added content
                  insertPosition += imgMarkdown.length;
                }
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
        
        // Remove repetitive content after conclusion
        // Find the conclusion heading and keep only the conclusion section (first substantial paragraph)
        const conclusionRegex = /(?:^|\n)##\s+Conclusion\s*\n/i;
        const conclusionMatch = extractedContent.match(conclusionRegex);
        
        if (conclusionMatch && conclusionMatch.index !== undefined) {
          const conclusionStart = conclusionMatch.index;
          const afterConclusionStart = conclusionStart + conclusionMatch[0].length;
          const afterConclusion = extractedContent.substring(afterConclusionStart);
          
          // Find the first substantial paragraph (ending with double newline or end of string)
          // This is the main conclusion paragraph
          const firstParagraphMatch = afterConclusion.match(/^(.+?)(?:\n\n|\n##\s|$)/s);
          
          if (firstParagraphMatch && firstParagraphMatch.index !== undefined) {
            const firstParaEnd = afterConclusionStart + firstParagraphMatch.index + firstParagraphMatch[0].length;
            
            // Check if there's repetitive content after the first paragraph
            const afterFirstPara = afterConclusion.substring(firstParagraphMatch[0].length);
            const repetitivePattern = /^(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?:\n|$)/gmi;
            
            if (afterFirstPara.match(repetitivePattern)) {
              // Remove everything after the first conclusion paragraph
              extractedContent = extractedContent.substring(0, firstParaEnd).trim();
            } else {
              // Keep first 2 paragraphs if they're substantial and not repetitive
              const paragraphMatches = afterConclusion.match(/.+?(?=\n\n|\n##\s|$)/gs) || [];
              let conclusionEnd = conclusionStart + conclusionMatch[0].length;
              for (let i = 0; i < Math.min(2, paragraphMatches.length); i++) {
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
          }
          
          // Final cleanup: Remove any remaining repetitive bullet-like sentences
          extractedContent = extractedContent.replace(/\n(?:The platform's|Integrating|Synthesia offers|Ready to|Sign up for)[^\n]*?[.!]\s*(?=\n|$)/gi, '');
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
        
        // Convert markdown to HTML
        let htmlContent = marked.parse(extractedContent, { async: false }) as string;
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
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
        });
        
        console.log('✅ Calendar content auto-published to WordPress:', publishResult);
      }
    } catch (autoPublishError) {
      // Don't fail the request if auto-publish fails - content is still saved
      console.error('⚠️ Auto-publish failed (content still saved):', autoPublishError);
    }

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