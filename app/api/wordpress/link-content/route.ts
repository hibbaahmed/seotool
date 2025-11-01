import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side content linking
 * Takes content and automatically adds internal links to related posts
 */
export async function POST(request: NextRequest) {
  try {
    const { content, slug } = await request.json();

    if (!content || !slug) {
      return NextResponse.json(
        { error: 'content and slug are required' },
        { status: 400 }
      );
    }

    // Fetch related posts
    const relatedPostsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/wordpress/related-posts?slug=${slug}&limit=3`,
      { cache: 'no-store' }
    );

    if (!relatedPostsResponse.ok) {
      return NextResponse.json({ linkedContent: content, linksAdded: 0 });
    }

    const { relatedPosts } = await relatedPostsResponse.json();
    if (!relatedPosts || relatedPosts.length === 0) {
      return NextResponse.json({ linkedContent: content, linksAdded: 0 });
    }

    let linkedContent = content;
    let linksAdded = 0;
    const maxLinks = 3;

    // Process each related post
    for (const post of relatedPosts.slice(0, maxLinks)) {
      if (linksAdded >= maxLinks) break;

      // Extract 2-3 word phrases from post title for natural linking
      const titleWords = post.title.split(/\s+/).filter(w => w.length > 4);
      
      if (titleWords.length < 2) continue;

      const phrases: string[] = [];
      
      // Create 2-word phrases
      for (let i = 0; i <= titleWords.length - 2; i++) {
        phrases.push(titleWords.slice(i, i + 2).join(' '));
      }

      // Sort by length (longer first) for better matching)
      phrases.sort((a, b) => b.length - a.length);

      let linkedThisPost = false;

      // Try to link each phrase (only first match per phrase)
      for (const phrase of phrases) {
        if (linksAdded >= maxLinks || linkedThisPost) break;

        const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Find all occurrences of the phrase (case-insensitive)
        const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(linkedContent)) !== null && !linkedThisPost) {
          const matchIndex = match.index;
          
          // Check if we're inside an existing link
          const beforeMatch = linkedContent.substring(0, matchIndex);
          const lastLinkOpen = beforeMatch.lastIndexOf('<a ');
          const lastLinkClose = beforeMatch.lastIndexOf('</a>');
          
          // Also check if we're inside an opening tag
          const lastOpenTag = beforeMatch.lastIndexOf('<');
          const lastCloseTag = beforeMatch.lastIndexOf('>');
          const isInsideTag = lastOpenTag > lastCloseTag;
          
          // Check if we're inside an iframe or embed (preserve YouTube videos and embeds)
          const recentTag = beforeMatch.substring(Math.max(0, lastOpenTag));
          const isInsideIframe = recentTag.includes('<iframe') && !recentTag.includes('</iframe>');
          const isInsideEmbed = recentTag.includes('<embed') || recentTag.includes('<object');

          // Only proceed if we're not inside an existing link, HTML tag, iframe, or embed
          if (lastLinkOpen <= lastLinkClose && !isInsideTag && !isInsideIframe && !isInsideEmbed) {
            const phraseText = match[0];
            const before = linkedContent.substring(0, matchIndex);
            const after = linkedContent.substring(matchIndex + phraseText.length);
            
            // Insert link
            const linkedPhrase = `<a href="/blog/${post.slug}" class="internal-link" data-link-type="auto-generated">${phraseText}</a>`;
            linkedContent = before + linkedPhrase + after;
            
            linksAdded++;
            linkedThisPost = true;
            break; // Move to next post after linking once
          }
        }
      }
    }

    return NextResponse.json({
      linkedContent,
      linksAdded,
    });
  } catch (error) {
    console.error('Error linking content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

