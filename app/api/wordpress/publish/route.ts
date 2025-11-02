import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { WordPressAPI } from '@/lib/wordpress/api';
import { marked } from 'marked';
import { addInternalLinksToContent } from '@/lib/add-links-to-content';

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

// Helper function to extract clean content from AI output
function extractContentFromAIOutput(fullOutput: string): string {
  if (!fullOutput) return '';
  
  let cleaned = fullOutput;
  
  // Step 1: Remove ALL numbered sections (very aggressive pattern matching)
  // Handle patterns: "1. **Title**", "1\. \*\*Title\*\*", "**Title**", with or without text after
  // Match lines starting with number, period, optional space, and Title/Meta/Content markers
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Title\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Title:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Title\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Title:\s*.*$/gmi, '');
  // Also handle escaped versions
  cleaned = cleaned.replace(/^\d+\\.\s*\\\*\\\*Title\\\*\\\*.*$/gmi, '');
  
  // Step 2: Remove Meta Description sections
  cleaned = cleaned.replace(/^\d+\.?\s*\*\*Meta Description\*\*.*$/gmi, '');
  cleaned = cleaned.replace(/^\d+\.?\s*Meta Description:.*$/gmi, '');
  cleaned = cleaned.replace(/^\*\*Meta Description\*\*[:\s]*.*$/gmi, '');
  cleaned = cleaned.replace(/^Meta Description:\s*.*$/gmi, '');
  // Also handle escaped versions
  cleaned = cleaned.replace(/^\d+\\.\s*\\\*\\\*Meta Description\\\*\\\*.*$/gmi, '');
  
  // Step 3: Find and extract the Content section (handle escaped and non-escaped markdown)
  // Look for "3. **Content**" or "**Content**" followed by actual content
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
  
  // If no Content section found, try to use everything after removing metadata sections
  if (!extractedContent) {
    extractedContent = cleaned;
  }
  
  // Step 4: Remove the duplicate H1 title (if present after Content marker)
  const lines = extractedContent.split('\n');
  let startIndex = 0;
  
  // Skip duplicate H1 at the start
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.match(/^#\s+.+$/)) {
      // Found H1, skip it and any blank lines after it
      startIndex = i + 1;
      while (startIndex < lines.length && lines[startIndex].trim() === '') {
        startIndex++;
      }
      break;
    } else if (line && !line.startsWith('#') && !line.match(/^\d+\./)) {
      // Found actual content (not a heading or numbered item)
      startIndex = i;
      break;
    }
  }
  
  extractedContent = lines.slice(startIndex).join('\n');
  
  // Step 5: Remove any remaining numbered sections and metadata (very aggressive)
  extractedContent = extractedContent.replace(/^\d+\.?\s*\*\*[^*]+\*\*.*$/gmi, '');
  extractedContent = extractedContent.replace(/^\d+\.?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*:.*$/gmi, '');
  // Remove lines that are just section markers
  extractedContent = extractedContent.replace(/^\d+\.\s*\*\*[^*]+\*\*\s*$/gmi, '');
  extractedContent = extractedContent.replace(/^\*\*(?:Title|Meta Description|Content|SEO Suggestions|Image Suggestions|Call-to-Action)\*\*\s*$/gmi, '');
  
  // Step 6: Remove trailing sections (SEO Suggestions, Call-to-Action, etc.)
  const stopKeywords = [
    '\n4. **SEO Suggestions',
    '\n**SEO Suggestions**',
    '\n## SEO Suggestions',
    '\n4. **Image Suggestions',
    '\n**Image Suggestions**',
    '\n## Image Suggestions',
    '\n5. **Call-to-Action',
    '\n**Call-to-Action**',
    '\n## Call-to-Action',
    '\n4. **Image',
    '\n5. **SEO',
    '\n6. **Call',
    '\nSEO Suggestions',
    '\nImage Suggestions',
    '\nCall-to-Action'
  ];
  
  for (const keyword of stopKeywords) {
    const index = extractedContent.indexOf(keyword);
    if (index !== -1) {
      extractedContent = extractedContent.substring(0, index);
      break;
    }
  }
  
  // Step 7: Final cleanup - remove any remaining numbered section markers
  // Do multiple passes to catch any we missed
  const sectionMarkers = [
    /^\d+\.\s*\*\*Title\*\*/gmi,
    /^\d+\.\s*\*\*Meta Description\*\*/gmi,
    /^\d+\.\s*\*\*Content\*\*/gmi,
    /^\d+\.\s*\*\*SEO Suggestions\*\*/gmi,
    /^\d+\.\s*\*\*Image Suggestions\*\*/gmi,
    /^\d+\.\s*\*\*Call-to-Action\*\*/gmi,
    /^\*\*Title\*\*/gmi,
    /^\*\*Meta Description\*\*/gmi,
    /^\*\*Content\*\*/gmi,
    /^\*\*SEO Suggestions\*\*/gmi,
    /^\*\*Image Suggestions\*\*/gmi,
    /^\*\*Call-to-Action\*\*/gmi,
  ];
  
  for (const pattern of sectionMarkers) {
    extractedContent = extractedContent.replace(pattern, '');
  }
  
  // Step 8: Clean up extra whitespace and ensure proper paragraph spacing
  extractedContent = extractedContent
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with double newline
    .replace(/^\s+/gm, '')        // Remove leading whitespace from lines
    .replace(/\n\n\n+/g, '\n\n')  // Ensure max 2 newlines between paragraphs
    .trim();
  
  // Step 9: Ensure proper spacing after headings
  extractedContent = extractedContent.replace(/(^##?[^\n]+\n)(\n)/gm, '$1\n');
  extractedContent = extractedContent.replace(/([^\n])\n(##?[^\n]+$)/gm, '$1\n\n$2');
  
  return extractedContent;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      siteId, 
      contentId, 
      contentType, 
      publishOptions = {} 
    } = body;

    if (!siteId || !contentId || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: siteId, contentId, contentType' 
      }, { status: 400 });
    }

    // Get the WordPress site
    const { data: site, error: siteError } = await supabase
      .from('wordpress_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }

    // Check if this is a WordPress.com site (OAuth)
    const isWPCom = (site as any).provider === 'wpcom';
    let publishedPost;

    // Get the content based on type
    let contentData;
    let tableName;

    switch (contentType) {
      case 'content':
        tableName = 'content_writer_outputs';
        break;
      case 'analysis':
        tableName = 'competitive_analysis';
        break;
      case 'seo_research':
        tableName = 'seo_research_outputs';
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Initialize WordPress API (only for self-hosted)
    let wpAPI: WordPressAPI | null = null;
    let tagIds: number[] = [];
    
    if (!isWPCom) {
      wpAPI = new WordPressAPI({
        id: (site as any).id,
        name: (site as any).name,
        url: (site as any).url,
        username: (site as any).username,
        password: (site as any).password,
        isActive: (site as any).is_active,
        createdAt: (site as any).created_at,
        updatedAt: (site as any).updated_at,
      });

      // Convert tag names to tag IDs if tags are provided as strings
      if (publishOptions.tags && publishOptions.tags.length > 0) {
        // Check if tags are strings (names) or numbers (IDs)
        if (typeof publishOptions.tags[0] === 'string') {
          // Tags are names, need to convert to IDs
          tagIds = await wpAPI.getOrCreateTagIds(publishOptions.tags);
        } else {
          // Tags are already IDs
          tagIds = publishOptions.tags;
        }
      }
    }

    // Prepare WordPress post data
    let postData: {
      title: string;
      content: string;
      excerpt: string;
      status: string;
      categories: any[];
      tags: any[];
      meta: any;
    } | null = null;
    
    switch (contentType) {
      case 'content':
        // Extract title from content_output - prioritize generated title over topic
        const contentOutput = (content as any).content_output || '';
        const topic = (content as any).topic || 'Generated Article';
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
            // Validate: title should be meaningful (not just "Title" or the topic)
            if (candidate.length > 5 && candidate.toLowerCase() !== 'title' && candidate.toLowerCase() !== topic.toLowerCase()) {
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
                  h1Title.toLowerCase() !== topic.toLowerCase()) {
                extractedTitle = h1Title;
              }
            }
          }
        }
        
        // Priority 3: Try to find any H1 in the content
        if (!extractedTitle) {
          const h1Patterns = [
            /(?:^|\n)#\s+([^\n]+?)(?:\n|$)/m,
            /#\s+([^\n]+?)(?:\n|$)/m
          ];
          for (const pattern of h1Patterns) {
            const matches = [...contentOutput.matchAll(pattern)];
            for (const match of matches) {
              if (match && match[1]) {
                const h1Title = match[1].trim();
                if (h1Title.length > 5 && 
                    !h1Title.match(/^(Content|Title|Meta Description|SEO|Image|Call-to-Action|Introduction|\d+\.)/i) &&
                    h1Title.toLowerCase() !== topic.toLowerCase()) {
                  extractedTitle = h1Title;
                  break;
                }
              }
            }
            if (extractedTitle) break;
          }
        }
        
        // Final fallback: use topic only if absolutely no title found
        if (!extractedTitle) {
          extractedTitle = topic;
          console.warn(`⚠️ Could not extract title from content, using topic: ${topic}`);
        } else {
          console.log(`✅ Extracted title: ${extractedTitle}`);
        }
        
        // Extract clean content from AI output (removes title, meta description, etc.)
        const extractedContent = extractContentFromAIOutput(contentOutput);
        postData = {
          title: extractedTitle,
          content: extractedContent,
          excerpt: extractedContent.substring(0, 160).replace(/[#*]/g, '') + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: tagIds,
          meta: {
            content_type: (content as any).content_type,
            target_audience: (content as any).target_audience,
            tone: (content as any).tone,
            length: (content as any).length,
          },
        };
        break;
      case 'analysis':
        // Get or create tag IDs for default tags (only for self-hosted)
        let analysisTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          analysisTagIds = await wpAPI.getOrCreateTagIds([
            'competitive-analysis', 
            'business-analysis',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `Competitive Analysis: ${(content as any).company_name} vs ${(content as any).competitor_name}`,
          content: (content as any).analysis_output,
          excerpt: (content as any).analysis_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: analysisTagIds,
          meta: {
            analysis_type: (content as any).analysis_type,
            company_name: (content as any).company_name,
            competitor_name: (content as any).competitor_name,
          },
        };
        break;
      case 'seo_research':
        // Get or create tag IDs for default tags (only for self-hosted)
        let seoTagIds = tagIds;
        if (!isWPCom && wpAPI) {
          seoTagIds = await wpAPI.getOrCreateTagIds([
            'seo', 
            'research', 
            'keywords',
            ...publishOptions.tags || []
          ]);
        }
        
        postData = {
          title: `SEO Research: ${(content as any).query}`,
          content: (content as any).research_output,
          excerpt: (content as any).research_output.substring(0, 160) + '...',
          status: publishOptions.status || 'publish',
          categories: publishOptions.categories || [],
          tags: seoTagIds,
          meta: {
            research_type: (content as any).research_type,
            target_audience: (content as any).target_audience,
            industry: (content as any).industry,
          },
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    // Ensure postData is defined
    if (!postData) {
      return NextResponse.json({ error: 'Failed to prepare post data' }, { status: 500 });
    }

    // Publish to WordPress
    if (isWPCom) {
      // Use WordPress.com REST API
      const accessToken = (site as any).access_token;
      const siteIdNum = (site as any).site_id;

      if (!accessToken || !siteIdNum) {
        return NextResponse.json({ 
          error: 'WordPress.com site missing credentials' 
        }, { status: 400 });
      }

      // WordPress.com API endpoint
      const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${siteIdNum}/posts/new`;
      
      // Convert Markdown to HTML for WordPress.com
      // Ensure images are properly converted from markdown (![alt](url)) to HTML (<img>)
      let htmlContent: string;
      if (typeof postData.content === 'string') {
        // Parse markdown to HTML
        htmlContent = marked.parse(postData.content, { async: false }) as string;
        // Double-check that markdown images were converted (should be HTML <img> tags now)
        if (htmlContent.includes('![') && htmlContent.includes('](')) {
          // If markdown images still exist, manually convert them
          htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        }
        // Add inline spacing styles
        htmlContent = addInlineSpacing(htmlContent);
        
        // Add automatic internal links AFTER converting to HTML
        try {
          console.log('🔗 Attempting to add internal links to content...');
          const { linkedContent, linksAdded } = await addInternalLinksToContent(
            htmlContent,
            postData.title
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
      } else {
        htmlContent = String(postData.content);
        // Add links even for non-markdown content
        try {
          console.log('🔗 Attempting to add internal links to content...');
          const { linkedContent, linksAdded } = await addInternalLinksToContent(
            htmlContent,
            postData.title
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
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: postData.title,
          content: htmlContent,
          excerpt: publishOptions.excerpt || postData.excerpt,
          status: publishOptions.status || 'publish',
          tags: publishOptions.tags || [],
          categories: publishOptions.categories || [],
          date: publishOptions.publishDate || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('WordPress.com publishing error:', error);
        return NextResponse.json({ 
          error: 'Failed to publish to WordPress.com',
          details: error
        }, { status: response.status });
      }

      publishedPost = await response.json();
    } else {
      // Use self-hosted WordPress REST API
      if (!wpAPI) {
        return NextResponse.json({ error: 'WordPress API not initialized' }, { status: 500 });
      }
      
      // Add automatic internal links to content before publishing (for self-hosted)
      const { linkedContent } = await addInternalLinksToContent(
        postData.content,
        postData.title,
        process.env.NEXT_PUBLIC_BASE_URL
      );
      postData.content = linkedContent;
      
      if (publishOptions.publishDate) {
        publishedPost = await wpAPI.schedulePost(postData as any, publishOptions.publishDate);
      } else {
        publishedPost = await wpAPI.createPost(postData as any);
      }
    }

    // Log the publishing activity
    await supabase
      .from('publishing_logs')
      .insert({
        user_id: user.id,
        site_id: siteId,
        content_id: contentId,
        content_type: contentType,
        post_id: publishedPost.id,
        status: 'published',
        published_at: new Date().toISOString(),
      } as any);

    return NextResponse.json({ 
      success: true, 
      post: publishedPost,
      message: `Content successfully published to ${(site as any).name}` 
    });
  } catch (error) {
    console.error('WordPress publishing error:', error);
    return NextResponse.json({ 
      error: 'Failed to publish content to WordPress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Get publishing logs for the site
    const { data: logs, error } = await supabase
      .from('publishing_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching publishing logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('WordPress logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}