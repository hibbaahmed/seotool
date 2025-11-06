/**
 * Helper function to add internal and external links to content before publishing
 * This ensures links are saved directly in WordPress content
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Extract key topics and phrases from article content
 */
function extractKeyTopics(content: string, title: string): string[] {
  // Combine title and content for topic extraction
  const fullText = `${title} ${content}`;
  
  // Remove HTML tags
  const textOnly = fullText.replace(/<[^>]*>/g, ' ');
  
  // Extract multi-word phrases (2-3 words) that might be good topics
  const words = textOnly.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i].replace(/[^\w]/g, '');
    const word2 = words[i + 1].replace(/[^\w]/g, '');
    if (word1.length > 3 && word2.length > 3) {
      phrases.push(`${word1} ${word2}`);
    }
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const word1 = words[i].replace(/[^\w]/g, '');
    const word2 = words[i + 1].replace(/[^\w]/g, '');
    const word3 = words[i + 2].replace(/[^\w]/g, '');
    if (word1.length > 3 && word2.length > 3 && word3.length > 3) {
      phrases.push(`${word1} ${word2} ${word3}`);
    }
  }
  
  // Count phrase frequency
  const phraseCounts: Record<string, number> = {};
  phrases.forEach(phrase => {
    phraseCounts[phrase] = (phraseCounts[phrase] || 0) + 1;
  });
  
  // Return top phrases (appearing at least 2 times)
  return Object.entries(phraseCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

/**
 * Search for authoritative sources related to article topics using Tavily
 */
async function findAuthoritativeSources(
  content: string,
  title: string
): Promise<Array<{ url: string; title: string; phrase: string }>> {
  try {
    if (!process.env.TAVILY_API_KEY) {
      console.log('⚠️ Tavily API key not found, skipping external link search');
      return [];
    }

    // Extract key topics from the article
    const keyTopics = extractKeyTopics(content, title);
    
    if (keyTopics.length === 0) {
      console.log('⚠️ No key topics found in content');
      return [];
    }

    console.log('🔍 Key topics found:', keyTopics.slice(0, 3));

    const sources: Array<{ url: string; title: string; phrase: string }> = [];

    // Search for authoritative sources for the top 2-3 topics
    for (const topic of keyTopics.slice(0, 3)) {
      try {
        const searchQuery = `${topic} guide official documentation`;
        
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: searchQuery,
            search_depth: 'basic',
            max_results: 2,
            include_domains: [
              'wikipedia.org',
              'github.com',
              '.edu',
              '.gov',
              'moz.com',
              'searchengineland.com',
              'hubspot.com',
              'semrush.com',
              'ahrefs.com',
              'contentmarketinginstitute.com',
              'copyblogger.com',
              'neilpatel.com',
              'backlinko.com'
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            // Take the first authoritative result
            const result = data.results[0];
            sources.push({
              url: result.url,
              title: result.title || topic,
              phrase: topic
            });
            console.log(`✅ Found authoritative source for "${topic}": ${result.url}`);
          }
        }
      } catch (err) {
        console.error(`⚠️ Error searching for topic "${topic}":`, err);
      }
    }

    return sources;
  } catch (error) {
    console.error('⚠️ Error finding authoritative sources:', error);
    return [];
  }
}

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
            const linkedPhrase = `<a href="${linkUrl}" class="internal-link" data-link-type="auto-generated" style="font-weight: 700 !important; color: #1d4ed8 !important; text-decoration: underline !important; text-decoration-thickness: 2.5px !important; text-underline-offset: 3px !important; background-color: rgba(37, 99, 235, 0.12) !important; padding: 3px 7px !important; border-radius: 5px !important; transition: all 0.2s ease !important; border: 1.5px solid rgba(37, 99, 235, 0.3) !important; box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1) !important;" onmouseover="this.style.backgroundColor='rgba(37, 99, 235, 0.25)'; this.style.color='#1e3a8a'; this.style.borderColor='rgba(37, 99, 235, 0.5)'; this.style.boxShadow='0 2px 5px rgba(37, 99, 235, 0.2)';" onmouseout="this.style.backgroundColor='rgba(37, 99, 235, 0.12)'; this.style.color='#1d4ed8'; this.style.borderColor='rgba(37, 99, 235, 0.3)'; this.style.boxShadow='0 1px 3px rgba(37, 99, 235, 0.1)';">${linkText}</a>`;
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

/**
 * Add external links to authoritative sources in content
 * Dynamically finds relevant sources based on article content
 * Uses the same styling as internal links for consistency
 */
export async function addExternalLinksToContent(
  content: string,
  title: string,
  maxLinks: number = 2
): Promise<{ linkedContent: string; linksAdded: number }> {
  try {
    console.log('🌐 Starting contextual external linking process');
    
    // Find authoritative sources relevant to this specific article
    const authoritativeSources = await findAuthoritativeSources(content, title);
    
    if (authoritativeSources.length === 0) {
      console.log('⚠️ No authoritative sources found for this article content');
      return { linkedContent: content, linksAdded: 0 };
    }

    let linkedContent = content;
    let linksAdded = 0;

    // Process each found source
    for (const source of authoritativeSources) {
      if (linksAdded >= maxLinks) break;

      let linkedThisSource = false;

      // Try to find and link the phrase in the content
      const escapedPhrase = source.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find occurrences of the phrase (case-insensitive)
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(linkedContent)) !== null && !linkedThisSource) {
        const matchIndex = match.index;
        
        // Check if we're inside an existing link
        const beforeMatch = linkedContent.substring(0, matchIndex);
        const lastLinkOpen = beforeMatch.lastIndexOf('<a ');
        const lastLinkClose = beforeMatch.lastIndexOf('</a>');
        
        // Check if we're inside an HTML tag
        const lastOpenTag = beforeMatch.lastIndexOf('<');
        const lastCloseTag = beforeMatch.lastIndexOf('>');
        const isInsideTag = lastOpenTag > lastCloseTag;
        
        // Check if we're inside an iframe or embed
        const recentTag = beforeMatch.substring(Math.max(0, lastOpenTag));
        const isInsideIframe = recentTag.includes('<iframe') && !recentTag.includes('</iframe>');
        const isInsideEmbed = recentTag.includes('<embed') || beforeMatch.includes('<object');

        // Only proceed if we're not inside an existing link, HTML tag, iframe, or embed
        if (lastLinkOpen <= lastLinkClose && !isInsideTag && !isInsideIframe && !isInsideEmbed) {
          const matchedText = match[0];
          
          const before = linkedContent.substring(0, matchIndex);
          const after = linkedContent.substring(matchIndex + matchedText.length);
          
          // Insert external link with same styling as internal links
          // Use green color variant to distinguish from internal links visually
          const linkedPhrase = `<a href="${source.url}" class="external-link" data-link-type="auto-generated" target="_blank" rel="noopener noreferrer" style="font-weight: 700 !important; color: #059669 !important; text-decoration: underline !important; text-decoration-thickness: 2.5px !important; text-underline-offset: 3px !important; background-color: rgba(5, 150, 105, 0.12) !important; padding: 3px 7px !important; border-radius: 5px !important; transition: all 0.2s ease !important; border: 1.5px solid rgba(5, 150, 105, 0.3) !important; box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1) !important;" onmouseover="this.style.backgroundColor='rgba(5, 150, 105, 0.25)'; this.style.color='#047857'; this.style.borderColor='rgba(5, 150, 105, 0.5)'; this.style.boxShadow='0 2px 5px rgba(5, 150, 105, 0.2)';" onmouseout="this.style.backgroundColor='rgba(5, 150, 105, 0.12)'; this.style.color='#059669'; this.style.borderColor='rgba(5, 150, 105, 0.3)'; this.style.boxShadow='0 1px 3px rgba(5, 150, 105, 0.1)';">${matchedText}</a>`;
          linkedContent = before + linkedPhrase + after;
          
          linksAdded++;
          linkedThisSource = true;
          console.log(`✅ Linked "${matchedText}" to authoritative source: ${source.url}`);
          break;
        }
      }
    }

    console.log(`🌐 Contextual external linking complete. Added ${linksAdded} external links`);
    return { linkedContent, linksAdded };
  } catch (error) {
    console.error('Error adding external links to content:', error);
    // Return original content if linking fails
    return { linkedContent: content, linksAdded: 0 };
  }
}

/**
 * Add strategic business mentions throughout content
 * Places mentions naturally without being promotional
 */
export async function addBusinessPromotionToContent(
  content: string,
  userId: string,
  maxMentions: number = 3
): Promise<{ linkedContent: string; mentionsAdded: number }> {
  try {
    console.log('💼 Starting business promotion process');
    
    // Fetch user's business information
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: onboardingProfile, error } = await supabase
      .from('user_onboarding_profiles')
      .select('business_name, website_url, business_description')
      .eq('user_id', userId)
      .single();
    
    if (error || !onboardingProfile || !onboardingProfile.business_name) {
      console.log('⚠️ No business information found for user');
      return { linkedContent: content, mentionsAdded: 0 };
    }
    
    const businessName = onboardingProfile.business_name;
    const websiteUrl = onboardingProfile.website_url;
    const businessDescription = onboardingProfile.business_description || '';
    
    console.log(`💼 Found business: ${businessName}`);
    
    // Check if business is already mentioned
    if (content.toLowerCase().includes(businessName.toLowerCase())) {
      console.log('⚠️ Business already mentioned in content, skipping promotion');
      return { linkedContent: content, mentionsAdded: 0 };
    }
    
    let linkedContent = content;
    let mentionsAdded = 0;
    
    // Find strategic insertion points in paragraphs
    // Look for patterns like: "solution", "tool", "platform", "service", etc.
    const insertionPatterns = [
      {
        pattern: /\b(solution|tool|platform|service|software|system)\s+(that|which|to)\s+/gi,
        variant: (name: string, desc: string) => desc 
          ? `${name} (${desc.split('.')[0]}) provides`
          : `${name} provides`
      },
      {
        pattern: /\b(many|some|several)\s+(companies|businesses|platforms|tools)\s+/gi,
        variant: (name: string) => `Companies like ${name} offer`
      },
      {
        pattern: /\b(enable|allows|helps?|provides?|offers?)\s+/gi,
        variant: (name: string) => `Platforms such as ${name} enable`
      },
      {
        pattern: /\b(consider|recommend|suggest|using|utilize)\s+/gi,
        variant: (name: string) => `Tools like ${name} help`
      }
    ];
    
    // Find insertion points by looking for specific patterns in the content
    // We'll insert mentions in strategic locations throughout the article
    
    const insertionPoints: Array<{ position: number; variant: string }> = [];
    
    // Search through content for insertion opportunities
    for (const { pattern, variant } of insertionPatterns) {
      if (insertionPoints.length >= maxMentions) break;
      
      pattern.lastIndex = 0;
      const textContent = linkedContent.replace(/<[^>]*>/g, ' '); // Get text-only version for matching
      const matches = [...textContent.matchAll(pattern)];
      
      for (const match of matches) {
        if (insertionPoints.length >= maxMentions) break;
        
        const matchIndex = match.index!;
        
        // Map text position back to HTML position (approximate)
        // Count HTML tags before this position
        const textBefore = textContent.substring(0, matchIndex);
        const htmlBefore = linkedContent.substring(0, linkedContent.length - textContent.length + matchIndex);
        
        // Find the actual HTML position by counting characters in text vs HTML
        let htmlPosition = 0;
        let textPos = 0;
        for (let i = 0; i < linkedContent.length && textPos < matchIndex; i++) {
          if (linkedContent[i] === '<') {
            // Skip HTML tag
            const tagEnd = linkedContent.indexOf('>', i);
            if (tagEnd !== -1) {
              i = tagEnd;
              continue;
            }
          } else {
            if (textPos === matchIndex) {
              htmlPosition = i;
              break;
            }
            textPos++;
          }
        }
        
        if (htmlPosition === 0 && matchIndex > 0) {
          // Fallback: approximate position
          htmlPosition = Math.floor(matchIndex * 1.2); // Rough estimate accounting for HTML tags
        }
        
        const beforeMatch = linkedContent.substring(0, htmlPosition);
        
        // Check if we're inside HTML tags or links
        const lastLinkOpen = beforeMatch.lastIndexOf('<a ');
        const lastLinkClose = beforeMatch.lastIndexOf('</a>');
        const lastTagOpen = beforeMatch.lastIndexOf('<');
        const lastTagClose = beforeMatch.lastIndexOf('>');
        const isInsideTag = lastTagOpen > lastTagClose;
        const isInsideLink = lastLinkOpen > lastLinkClose;
        
        // Also check if we're near the beginning or end (avoid intro/conclusion)
        const contentLength = linkedContent.length;
        const positionPercent = (htmlPosition / contentLength) * 100;
        
        if (!isInsideTag && !isInsideLink && positionPercent > 15 && positionPercent < 80) {
          // Check spacing from other mentions (at least 20% of content apart)
          const minGap = contentLength * 0.20;
          const tooClose = insertionPoints.some(point => 
            Math.abs(point.position - htmlPosition) < minGap
          );
          
          if (!tooClose) {
            insertionPoints.push({
              position: htmlPosition + match[0].length + 10, // Add some space after match
              variant: variant(businessName, businessDescription)
            });
          }
        }
      }
    }
    
    // Sort by position (reverse order for safe insertion)
    insertionPoints.sort((a, b) => b.position - a.position);
    
    // Insert mentions
    for (const point of insertionPoints.slice(0, maxMentions)) {
      // Ensure we're inserting at a safe position (after a word boundary)
      let insertPos = point.position;
      
      // Find the nearest space or punctuation for safe insertion
      for (let i = insertPos; i < Math.min(insertPos + 50, linkedContent.length); i++) {
        if (linkedContent[i] === ' ' || linkedContent[i] === ',' || linkedContent[i] === '.') {
          insertPos = i + 1;
          break;
        }
      }
      
      // If we're still inside a tag, skip this mention
      const beforeInsert = linkedContent.substring(0, insertPos);
      const lastTagOpen = beforeInsert.lastIndexOf('<');
      const lastTagClose = beforeInsert.lastIndexOf('>');
      if (lastTagOpen > lastTagClose) {
        continue; // Skip - we're inside a tag
      }
      
      let businessMention: string;
      
      if (websiteUrl) {
        // Create mention with link
        const mentionText = point.variant;
        // Extract just the action part (e.g., "provides", "offers") after business name
        const actionPart = mentionText.replace(businessName, '').trim();
        businessMention = ` <a href="${websiteUrl}" target="_blank" rel="noopener noreferrer" class="business-promotion-link" style="font-weight: 600 !important; color: #059669 !important; text-decoration: none !important; border-bottom: 1px solid #059669 !important;">${businessName}</a>`;
        if (actionPart) {
          businessMention = `${businessMention} ${actionPart}`;
        }
      } else {
        businessMention = ` ${point.variant}`;
      }
      
      linkedContent = linkedContent.substring(0, insertPos) + businessMention + linkedContent.substring(insertPos);
      mentionsAdded++;
      console.log(`✅ Added business mention for "${businessName}"`);
    }
    
    console.log(`💼 Business promotion complete. Added ${mentionsAdded} mentions`);
    return { linkedContent, mentionsAdded };
  } catch (error) {
    console.error('Error adding business promotion to content:', error);
    return { linkedContent: content, mentionsAdded: 0 };
  }
}

