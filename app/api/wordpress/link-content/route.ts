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

      // Extract important words from post title (including brand names)
      const allTitleWords = post.title.split(/\s+/);
      const importantWords = allTitleWords.filter((w: string) => {
        const clean = w.replace(/[^\w]/g, '').toLowerCase();
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

      // Try to link each phrase (only first match per phrase)
      for (const phrase of phrases) {
        if (linksAdded >= maxLinks || linkedThisPost) break;

        // Clean phrase of punctuation for matching
        const cleanPhrase = phrase.replace(/[^\w\s]/g, '');
        const escapedPhrase = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Find all occurrences of the phrase (case-insensitive)
        // Allow for possessive forms and punctuation (e.g., "Synthesia" matches "Synthesia's")
        const regex = new RegExp(`\\b${escapedPhrase}['s]*\\b`, 'gi');
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
            
            // Insert link with strong inline styling to ensure visibility across contexts
            const linkedPhrase = `<a href="/blog/${post.slug}/" class="internal-link" data-link-type="auto-generated" style="font-weight: 700 !important; color: #1d4ed8 !important; text-decoration: underline !important; text-decoration-thickness: 2.5px !important; text-underline-offset: 3px !important; background-color: rgba(37, 99, 235, 0.12) !important; padding: 3px 7px !important; border-radius: 5px !important; transition: all 0.2s ease !important; border: 1.5px solid rgba(37, 99, 235, 0.3) !important; box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1) !important;" onmouseover="this.style.backgroundColor='rgba(37, 99, 235, 0.25)'; this.style.color='#1e3a8a'; this.style.borderColor='rgba(37, 99, 235, 0.5)'; this.style.boxShadow='0 2px 5px rgba(37, 99, 235, 0.2)';" onmouseout="this.style.backgroundColor='rgba(37, 99, 235, 0.12)'; this.style.color='#1d4ed8'; this.style.borderColor='rgba(37, 99, 235, 0.3)'; this.style.boxShadow='0 1px 3px rgba(37, 99, 235, 0.1)';">${linkText}</a>`;
            linkedContent = before + linkedPhrase + after;
            
            linksAdded++;
            linkedThisPost = true;
            break; // Move to next post after linking once
          }
        }
      }
    }

    console.log(`🔗 [/api/wordpress/link-content] Links added: ${linksAdded} for slug: ${slug}`);
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

