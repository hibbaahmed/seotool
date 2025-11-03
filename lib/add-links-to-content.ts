/**
 * Helper function to add internal links to content before publishing
 * This ensures links are saved directly in WordPress content
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function addInternalLinksToContent(
  content: string,
  title: string,
  baseUrl?: string
): Promise<{ linkedContent: string; linksAdded: number }> {
  try {
    console.log('🔗 Starting interlinking process for:', title);
    
    // Fetch posts directly from WordPress API to avoid server-side fetch issues
    // This works both in development and production
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    if (!wpUrl) {
      console.error('⚠️ NEXT_PUBLIC_WORDPRESS_API_URL not set');
      return { linkedContent: content, linksAdded: 0 };
    }

    // Check if using WordPress.com or self-hosted
    const isWPCom = wpUrl.includes('wordpress.com');
    let posts: any[] = [];

    if (isWPCom) {
      // For WordPress.com, fetch from Supabase where posts are stored
      try {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { data: wpSites } = await supabase
          .from('wordpress_sites')
          .select('*')
          .eq('provider', 'wpcom')
          .single();

        if (wpSites) {
          const siteId = (wpSites as any).site_id;
          const accessToken = (wpSites as any).access_token;
          
          const wpResponse = await fetch(
            `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts?number=50&status=publish`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              cache: 'no-store',
            }
          );
          
          if (wpResponse.ok) {
            const data = await wpResponse.json();
            posts = data.posts || [];
            console.log(`📚 Fetched ${posts.length} posts from WordPress.com`);
          }
        }
      } catch (err) {
        console.error('⚠️ Error fetching from WordPress.com:', err);
      }
    } else {
      // For self-hosted WordPress, use REST API
      try {
        const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=50&_embed`, {
          cache: 'no-store',
        });
        
        if (wpResponse.ok) {
          posts = await wpResponse.json();
          console.log(`📚 Fetched ${posts.length} posts from self-hosted WordPress`);
        }
      } catch (err) {
        console.error('⚠️ Error fetching from self-hosted WordPress:', err);
      }
    }

    if (posts.length === 0) {
      console.log('⚠️ No posts found for linking');
      return { linkedContent: content, linksAdded: 0 };
    }
    
    // Transform posts to consistent format
    const transformedPosts = posts.map((post: any) => {
      if (isWPCom) {
        return {
          title: post.title || '',
          slug: post.slug || '',
        };
      } else {
        return {
          title: post.title?.rendered || post.title || '',
          slug: post.slug || '',
        };
      }
    });
    
    console.log(`🔗 Found ${posts.length} posts to check for linking opportunities`);

    // Enhanced keyword extraction from title for matching
    // Extract both long words AND capitalized words (brand names)
    const titleWords = title.split(/\s+/);
    const titleKeywords = titleWords
      .map(w => w.toLowerCase().replace(/['".,!?;:]/g, ''))
      .filter(w => w.length > 4);
    
    // Also extract capitalized words (potential brand names)
    const capitalizedWords = titleWords
      .map(w => w.replace(/['".,!?;:]/g, ''))
      .filter(w => w.length >= 3 && /^[A-Z]/.test(w) && w.length >= 5)
      .map(w => w.toLowerCase());

    // Combine keywords
    const allKeywords = [...new Set([...titleKeywords, ...capitalizedWords])];

    // Find similar posts based on title keywords
    const similarPosts = transformedPosts
      .map((post: any) => {
        const postTitle = post.title || '';
        const postTitleWords = postTitle
          .toLowerCase()
          .split(/\s+/)
          .map((w: string) => w.replace(/['".,!?;:]/g, ''))
          .filter((w: string) => w.length > 4);
        
        // Also check for capitalized brand names in post title
        const postCapitalized = postTitle
          .split(/\s+/)
          .map((w: string) => w.replace(/['".,!?;:]/g, ''))
          .filter((w: string) => w.length >= 3 && /^[A-Z]/.test(w))
          .map((w: string) => w.toLowerCase());
        
        // Check for shared keywords (including brand names)
        const sharedWords = allKeywords.filter(kw => 
          postTitleWords.includes(kw) || postCapitalized.includes(kw)
        );
        
        // Boost similarity if brand names match
        const brandNameMatch = capitalizedWords.some(kw => 
          postCapitalized.includes(kw)
        );

        const baseSimilarity = sharedWords.length / Math.max(allKeywords.length, postTitleWords.length);
        const similarity = brandNameMatch ? Math.min(baseSimilarity * 1.5, 1.0) : baseSimilarity;

        return {
          post,
          similarity,
        };
      })
      .filter((item: any) => item.similarity > 0.1) // Lower threshold to catch brand name matches
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 3)
      .map((item: any) => item.post);

    if (similarPosts.length === 0) {
      console.log('⚠️ No similar posts found for linking');
      return { linkedContent: content, linksAdded: 0 };
    }
    
    console.log(`✅ Found ${similarPosts.length} similar posts to link to:`, similarPosts.map((p: any) => p.title));

    let linkedContent = content;
    let linksAdded = 0;
    const maxLinks = 3;

    // Process each similar post
    for (const post of similarPosts.slice(0, maxLinks)) {
      if (linksAdded >= maxLinks) break;

      // Extract important words from post title (including brand names)
      const allTitleWords = post.title.split(/\s+/);
      const importantWords = allTitleWords.filter((w: string) => {
        const clean = w.replace(/[^\w]/g, '').toLowerCase();
        // Include words that are longer than 4 chars OR capitalized (potential brand names)
        return clean.length > 4 || (clean.length >= 3 && /[A-Z]/.test(w.charAt(0)));
      });
      
      if (importantWords.length === 0) continue;

      const phrases: string[] = [];
      
      // Add single important words (brand names like "Synthesia")
      // Check for capitalized words that might be brand names
      allTitleWords.forEach((w: string) => {
        // Remove punctuation but keep the base word (e.g., "Synthesia's" -> "Synthesia")
        const clean = w.replace(/['".,!?;:]/g, '').replace(/[^\w]/g, '');
        if (clean.length >= 5 && /^[A-Z]/.test(clean) && !/^(The|A|An|In|On|At|To|For|Of|With|By)$/i.test(clean)) {
          // Add both the base word and the original (for possessive matching)
          if (!phrases.includes(clean)) {
            phrases.push(clean);
          }
          // Also add original if it has possessive or is different
          if (w.includes("'s") && !phrases.includes(w)) {
            phrases.push(w);
          }
        }
      });
      
      // Create 2-word phrases from important words
      if (importantWords.length >= 2) {
        for (let i = 0; i <= importantWords.length - 2; i++) {
          phrases.push(importantWords.slice(i, i + 2).join(' '));
        }
      }
      
      // Also add single important words (for brand names)
      importantWords.forEach((w: string) => {
        // Remove punctuation but keep base word
        const clean = w.replace(/['".,!?;:]/g, '').replace(/[^\w]/g, '').toLowerCase();
        if (clean.length >= 5 && !phrases.some(p => p.toLowerCase().replace(/['".,!?;:]/g, '').includes(clean))) {
          phrases.push(w);
        }
      });

      // Sort by length (longer first), prioritize capitalized words (brand names)
      phrases.sort((a, b) => {
        const aIsCapitalized = /^[A-Z]/.test(a.replace(/[^\w]/g, ''));
        const bIsCapitalized = /^[A-Z]/.test(b.replace(/[^\w]/g, ''));
        if (aIsCapitalized && !bIsCapitalized) return -1;
        if (!aIsCapitalized && bIsCapitalized) return 1;
        return b.length - a.length;
      });

      let linkedThisPost = false;

      // Try to link each phrase
      for (const phrase of phrases) {
        if (linksAdded >= maxLinks || linkedThisPost) break;

        // Clean phrase of punctuation for matching
        const cleanPhrase = phrase.replace(/[^\w\s]/g, '');
        const escapedPhrase = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Find occurrences of the phrase (case-insensitive)
        // Allow for possessive forms and punctuation (e.g., "Synthesia" matches "Synthesia's")
        const regex = new RegExp(`\\b${escapedPhrase}['s]*\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(linkedContent)) !== null && !linkedThisPost) {
          const matchIndex = match.index;
          
          // Check if we're inside an existing link
          const beforeMatch = linkedContent.substring(0, matchIndex);
          const lastLinkOpen = beforeMatch.lastIndexOf('<a ');
          const lastLinkClose = beforeMatch.lastIndexOf('</a>');
          
          // Check if we're inside an HTML tag (but allow inside text content of tags)
          const lastOpenTag = beforeMatch.lastIndexOf('<');
          const lastCloseTag = beforeMatch.lastIndexOf('>');
          const isInsideTag = lastOpenTag > lastCloseTag;
          
          // Also check if we're inside an iframe or other embed tag (preserve these)
          const recentTag = beforeMatch.substring(Math.max(0, lastOpenTag));
          const isInsideIframe = recentTag.includes('<iframe') && !recentTag.includes('</iframe>');
          const isInsideEmbed = recentTag.includes('<embed') || beforeMatch.includes('<object');

          // Only proceed if we're not inside an existing link, HTML tag, iframe, or embed
          if (lastLinkOpen <= lastLinkClose && !isInsideTag && !isInsideIframe && !isInsideEmbed) {
            // Use the matched text from content (includes any punctuation/possessive)
            const matchedText = match[0];
            // Find the base word (without possessive) for the link text
            const baseWord = cleanPhrase;
            // Use matched text for link, but clean it if it's just possessive
            const linkText = matchedText.endsWith("'s") && matchedText.toLowerCase().startsWith(baseWord.toLowerCase()) 
              ? matchedText 
              : baseWord;
            
            const before = linkedContent.substring(0, matchIndex);
            const after = linkedContent.substring(matchIndex + matchedText.length);
            
            // Create correct blog post URL
            // Blog posts are at /blog/slug/ not /slug/
            const linkUrl = `/blog/${post.slug}/`;
            
            // Insert link with enhanced visibility styling (inline for WordPress compatibility)
            // Bold, bright blue color, thick underline, visible background with border
            const linkedPhrase = `<a href="${linkUrl}" class="internal-link" data-link-type="auto-generated" style="font-weight: 700; color: #1d4ed8; text-decoration: underline; text-decoration-thickness: 2.5px; text-underline-offset: 3px; background-color: rgba(37, 99, 235, 0.12); padding: 3px 7px; border-radius: 5px; transition: all 0.2s ease; border: 1.5px solid rgba(37, 99, 235, 0.3); box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1);" onmouseover="this.style.backgroundColor='rgba(37, 99, 235, 0.25)'; this.style.color='#1e3a8a'; this.style.borderColor='rgba(37, 99, 235, 0.5)'; this.style.boxShadow='0 2px 5px rgba(37, 99, 235, 0.2)';" onmouseout="this.style.backgroundColor='rgba(37, 99, 235, 0.12)'; this.style.color='#1d4ed8'; this.style.borderColor='rgba(37, 99, 235, 0.3)'; this.style.boxShadow='0 1px 3px rgba(37, 99, 235, 0.1)';">${linkText}</a>`;
            linkedContent = before + linkedPhrase + after;
            
            linksAdded++;
            linkedThisPost = true;
            console.log(`✅ Linked "${linkText}" to post: ${post.title}`);
            break;
          }
        }
      }
    }

    return { linkedContent, linksAdded };
  } catch (error) {
    console.error('Error adding internal links to content:', error);
    // Return original content if linking fails
    return { linkedContent: content, linksAdded: 0 };
  }
}

