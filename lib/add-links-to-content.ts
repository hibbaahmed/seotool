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
    const response = await fetch(`${baseUrl}/api/wordpress/posts?limit=20`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return { linkedContent: content, linksAdded: 0 };
    }

    const { posts } = await response.json();
    if (!posts || posts.length === 0) {
      return { linkedContent: content, linksAdded: 0 };
    }

    // Simple keyword extraction from title for matching
    const titleKeywords = title
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4);

    // Find similar posts based on title keywords
    const similarPosts = posts
      .map((post: any) => {
        const postTitleWords = post.title
          .toLowerCase()
          .split(/\s+/)
          .filter((w: string) => w.length > 4);
        
        const sharedWords = titleKeywords.filter(kw => 
          postTitleWords.includes(kw)
        );

        return {
          post,
          similarity: sharedWords.length / Math.max(titleKeywords.length, postTitleWords.length),
        };
      })
      .filter((item: any) => item.similarity > 0.2)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 3)
      .map((item: any) => item.post);

    if (similarPosts.length === 0) {
      return { linkedContent: content, linksAdded: 0 };
    }

    let linkedContent = content;
    let linksAdded = 0;
    const maxLinks = 3;

    // Process each similar post
    for (const post of similarPosts.slice(0, maxLinks)) {
      if (linksAdded >= maxLinks) break;

      // Extract 2-word phrases from post title
      const titleWords = post.title.split(/\s+/).filter((w: string) => w.length > 4);
      
      if (titleWords.length < 2) continue;

      const phrases: string[] = [];
      
      // Create 2-word phrases
      for (let i = 0; i <= titleWords.length - 2; i++) {
        phrases.push(titleWords.slice(i, i + 2).join(' '));
      }

      // Sort by length (longer first)
      phrases.sort((a, b) => b.length - a.length);

      let linkedThisPost = false;

      // Try to link each phrase
      for (const phrase of phrases) {
        if (linksAdded >= maxLinks || linkedThisPost) break;

        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Find occurrences of the phrase (case-insensitive)
        const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
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
            const phraseText = match[0];
            const before = linkedContent.substring(0, matchIndex);
            const after = linkedContent.substring(matchIndex + phraseText.length);
            
            // Create WordPress-friendly permalink
            // WordPress uses relative URLs for internal links, or we can use the post slug
            // Format: /post-slug/ (WordPress permalink structure)
            const linkUrl = `/${post.slug}/`;
            
            // Insert link with WordPress-friendly attributes
            const linkedPhrase = `<a href="${linkUrl}" class="internal-link" data-link-type="auto-generated">${phraseText}</a>`;
            linkedContent = before + linkedPhrase + after;
            
            linksAdded++;
            linkedThisPost = true;
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

