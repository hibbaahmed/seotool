/**
 * Helper function to add internal links to content before publishing
 * This ensures links are saved directly in WordPress content
 */

export async function addInternalLinksToContent(
  content: string,
  title: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
): Promise<{ linkedContent: string; linksAdded: number }> {
  try {
    // Generate a temporary slug from title for finding related posts
    const tempSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Fetch related posts (we'll need to get all posts and find similar ones)
    // Since we don't have the slug yet, we'll use a simplified approach
    const response = await fetch(`${baseUrl}/api/wordpress/posts?limit=50`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.log('⚠️ Failed to fetch posts for linking:', response.status);
      return { linkedContent: content, linksAdded: 0 };
    }

    const { posts } = await response.json();
    if (!posts || posts.length === 0) {
      console.log('⚠️ No posts found for linking');
      return { linkedContent: content, linksAdded: 0 };
    }
    
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
    const similarPosts = posts
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
            
            // Create WordPress-friendly permalink
            // WordPress uses relative URLs for internal links, or we can use the post slug
            // Format: /post-slug/ (WordPress permalink structure)
            const linkUrl = `/${post.slug}/`;
            
            // Insert link with WordPress-friendly attributes
            const linkedPhrase = `<a href="${linkUrl}" class="internal-link" data-link-type="auto-generated">${linkText}</a>`;
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

