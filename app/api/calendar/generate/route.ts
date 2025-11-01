import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getAdapter } from '@/lib/integrations/getAdapter';
import { marked } from 'marked';

// Helper function to add inline spacing styles to HTML
function addInlineSpacing(html: string): string {
  // Add inline styles to ensure proper spacing in WordPress
  // This ensures spacing works regardless of the WordPress theme's CSS
  
  // Add spacing to paragraphs (1.5em top and bottom)
  html = html.replace(/<p>/gi, '<p style="margin-top: 1.5em; margin-bottom: 1.5em; line-height: 1.75;">');
  
  // Add spacing to headings
  html = html.replace(/<h2>/gi, '<h2 style="margin-top: 2em; margin-bottom: 1em; font-weight: 700;">');
  html = html.replace(/<h3>/gi, '<h3 style="margin-top: 1.75em; margin-bottom: 0.875em; font-weight: 700;">');
  html = html.replace(/<h4>/gi, '<h4 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h5>/gi, '<h5 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  html = html.replace(/<h6>/gi, '<h6 style="margin-top: 1.5em; margin-bottom: 0.75em; font-weight: 700;">');
  
  // Remove top margin from first paragraph
  html = html.replace(/^(<p style="[^"]*">)/, '<p style="margin-top: 0; margin-bottom: 1.5em; line-height: 1.75;">');
  
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
          
          const contentType = resp.headers.get('Content-Type') || 'image/jpeg';
          const blob = await resp.blob();
          console.log(`📦 Image ${i + 1} blob size:`, blob.size, 'bytes', 'contentType:', contentType);
          
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

          console.log(`📁 Uploading to path:`, path);

          const uploadRes = await storage.storage.from('photos').upload(path, blob, {
            cacheControl: '3600',
            upsert: true,
            contentType,
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

    // Generate content using the content writer API with uploaded image URLs
    const contentPrompt = `Topic: "${keywordText}"
Content Type: ${content_type}
Target Audience: ${target_audience || 'General audience'}
Tone: ${tone}
Length: Long-form (1500-2500 words)

AVAILABLE IMAGES (embed these using Markdown throughout the article):
${uploadedImageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Please create comprehensive, SEO-optimized content for this topic. Include:
- An engaging title and meta description
- Start directly with 2-4 introductory paragraphs after the main title (NO "Introduction:" heading or label)
- Embed images using ![alt text](URL) near relevant sections - place images after H2 headings or first paragraphs
- Distribute images throughout the article (not all at the end)
- Use actual image URLs provided above (DO NOT write placeholders)
- Well-structured sections using Markdown headings (## for H2, ### for H3)
- Never write literal labels like "H2:", "H3:", "Introduction:", or "Understanding [Topic]:" in the body
- Paragraphs should flow directly after the main title and after subheadings
- Actionable insights and valuable information
- Natural keyword integration
- Internal linking opportunities
- End the article with a single closing call-to-action paragraph, WITHOUT any heading label

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

    // Stream the response and collect the full content
    let fullContent = '';
    let streamedImageUrls: string[] = [];
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
        // Extract title from content_output
        const contentOutput = fullContent || '';
        let extractedTitle = keywordText;
        
        // First, try to extract from Title section
        const titlePatterns = [
          /(?:^|\n)(?:\d+\.\s*)?\*\*Title\*\*[:\s]*\n([^\n]+)/i,
          /(?:^|\n)Title:\s*"?([^"\n]+)"?/i,
          /(?:^|\n)\*\*Title\*\*[:\s]*\n([^\n]+)/i
        ];
        for (const pattern of titlePatterns) {
          const match = contentOutput.match(pattern);
          if (match && match[1]) {
            extractedTitle = match[1].trim().replace(/^["']|["']$/g, '');
            break;
          }
        }
        
        // If title not found yet, try to extract from H1 in content section
        const contentSectionMatch = contentOutput.match(/(?:^|\n)(?:\d+\.\s*)?\*\*Content\*\*[:\s]*\n/i);
        if (contentSectionMatch) {
          const afterContent = contentOutput.substring(contentSectionMatch.index! + contentSectionMatch[0].length);
          const h1Match = afterContent.match(/^#\s+([^\n]+)/m);
          if (h1Match && h1Match[1]) {
            const h1Title = h1Match[1].trim();
            if (h1Title.length > 10 && !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action)/i)) {
              extractedTitle = h1Title;
            }
          }
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
        
        // Remove duplicate H1 title at the start
        const lines = extractedContent.split('\n');
        let startIndex = 0;
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const line = lines[i].trim();
          if (line.match(/^#\s+.+$/)) {
            startIndex = i + 1;
            while (startIndex < lines.length && lines[startIndex].trim() === '') {
              startIndex++;
            }
            break;
          } else if (line && !line.startsWith('#') && !line.match(/^\d+\./)) {
            startIndex = i;
            break;
          }
        }
        extractedContent = lines.slice(startIndex).join('\n');
        
        // Remove remaining numbered sections
        extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
        extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
        extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
        
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
        
        // Convert markdown to HTML
        let htmlContent = marked.parse(extractedContent, { async: false }) as string;
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        }
        // Add inline spacing styles
        htmlContent = addInlineSpacing(htmlContent);
        
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