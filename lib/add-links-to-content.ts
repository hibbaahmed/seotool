/**
 * Helper function to add internal and external links to content before publishing
 * This ensures links are saved directly in WordPress content
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const STOP_WORDS = new Set([
  'the','and','that','with','from','this','than','then','when','where','which',
  'your','you','for','are','was','were','have','has','into','onto','over','more',
  'less','most','while','after','before','since','because','within','without',
  'about','across','between','among','through','every','other','some','many',
  'such','like','also','very','much','just','even','make','makes','made','does',
  'did','doing','can','could','should','would','might','must','need','needs',
  'those','these','their','there','here','them','they','our','ours','per',
  'using','use','used','due','each','both','instead','however','overall',
  'including','within','beyond','against','around','toward','towards','rather',
  'than','because','though','although','across','always','often','still','into',
  'every','never','during','before','after','while','once','until','whose','ourselves'
]);

function cleanWord(word: string): string {
  return word.replace(/[^\w]/g, '').toLowerCase();
}

function isMeaningfulPhrase(words: string[]): boolean {
  if (words.length === 0) return false;
  const meaningfulWords = words.filter(
    word => word.length >= 3 && !STOP_WORDS.has(word)
  );
  if (meaningfulWords.length === 0) {
    return false;
  }
  // Avoid phrases made of the same short connector repeated
  const uniqueMeaningful = new Set(meaningfulWords);
  if (uniqueMeaningful.size === 1 && meaningfulWords[0].length < 4) {
    return false;
  }
  return true;
}

/**
 * Extract key topics and phrases from article content
 */
function extractKeyTopics(content: string, title: string): string[] {
  // Combine title and content for topic extraction
  const fullText = `${title} ${content}`;
  
  // Remove HTML tags
  const textOnly = fullText.replace(/<[^>]*>/g, ' ');
  
  // Extract multi-word phrases (2-3 words) that might be good topics
  const words = textOnly
    .toLowerCase()
    .split(/\s+/)
    .map(cleanWord)
    .filter(Boolean);
  const phrases: string[] = [];
  
  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phraseWords = [words[i], words[i + 1]];
    if (isMeaningfulPhrase(phraseWords)) {
      phrases.push(phraseWords.join(' '));
    }
  }
  
  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phraseWords = [words[i], words[i + 1], words[i + 2]];
    if (isMeaningfulPhrase(phraseWords)) {
      phrases.push(phraseWords.join(' '));
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

    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('auto_promote_business')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('⚠️ Failed to load user settings for business promotion:', settingsError);
    }

    if (!userSettings?.auto_promote_business) {
      console.log('ℹ️ Auto promotion disabled for this user. Skipping business mentions.');
      return { linkedContent: content, mentionsAdded: 0 };
    }
    
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
    
    // Check how many mentions already exist in the main content (excluding conclusion)
    // Split content to exclude conclusion section
    const conclusionMatch = content.match(/(?:^|\n)##\s+Conclusion[^\n]*/i);
    const mainContent = conclusionMatch 
      ? content.substring(0, conclusionMatch.index || content.length)
      : content;
    
    const existingMentions = (mainContent.toLowerCase().match(new RegExp(businessName.toLowerCase(), 'g')) || []).length;
    console.log(`💼 Found ${existingMentions} existing mentions in main content`);
    
    // If there are already 2+ mentions in main content, skip adding more
    if (existingMentions >= 2) {
      console.log('ℹ️ Business already has sufficient mentions throughout main content');
      return { linkedContent: content, mentionsAdded: 0 };
    }
    
    let linkedContent = content;
    let mentionsAdded = 0;

    const desiredMentions = Math.min(Math.max(maxMentions, 0), 3);
    const mentionBlocks = buildBusinessMentionBlocks({
      businessName,
      businessDescription,
      websiteUrl,
      maxCount: desiredMentions,
    });

    if (mentionBlocks.length === 0) {
      console.log('⚠️ No business mention blocks generated');
      return { linkedContent: content, mentionsAdded };
    }

    const insertionPositions = findBusinessMentionPositions(linkedContent, mentionBlocks.length);

    if (insertionPositions.length === 0) {
      console.log('⚠️ No suitable insertion points for business mentions');
      return { linkedContent: content, mentionsAdded };
    }

    const inserts = insertionPositions
      .slice(0, mentionBlocks.length)
      .map((position, index) => ({
        position,
        block: mentionBlocks[index],
      }))
      .sort((a, b) => b.position - a.position);

    for (const { position, block } of inserts) {
      const safePosition = adjustPositionToParagraph(linkedContent, position);
      linkedContent =
        linkedContent.slice(0, safePosition) + `\n\n${block}\n\n` + linkedContent.slice(safePosition);
      mentionsAdded++;
      console.log(`✅ Inserted business mention for "${businessName}" at position ${safePosition}`);
    }
    
    console.log(`💼 Business promotion complete. Added ${mentionsAdded} mentions`);
    return { linkedContent, mentionsAdded };
  } catch (error) {
    console.error('Error adding business promotion to content:', error);
    return { linkedContent: content, mentionsAdded: 0 };
  }
}

function extractFirstSentence(text?: string | null): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/[^.!?]+[.!?]?/);
  return match ? match[0].trim() : cleaned;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function normalizeSentenceWithBusinessName(name: string, sentence: string): string {
  const cleaned = sentence.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return `${name} helps clients implement these strategies without adding more work to their internal team.`;
  }
  if (cleaned.toLowerCase().startsWith(name.toLowerCase())) {
    return ensureSentence(cleaned);
  }
  const lowerFirst =
    cleaned.length > 0 ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : cleaned;
  return ensureSentence(`${name} ${lowerFirst}`);
}

function buildBusinessMentionBlocks({
  businessName,
  businessDescription,
  websiteUrl,
  maxCount,
}: {
  businessName: string;
  businessDescription?: string | null;
  websiteUrl?: string | null;
  maxCount: number;
}): string[] {
  if (maxCount <= 0) return [];
  const firstSentence = extractFirstSentence(businessDescription);
  const baseSentence = firstSentence
    ? normalizeSentenceWithBusinessName(businessName, firstSentence)
    : `${businessName} helps clients implement these strategies without adding more work to their internal team.`;
  const supportingSentences = [
    baseSentence,
    `${businessName} can tailor these playbooks to your workflows, caseload, and goals.`,
    `${businessName} keeps execution moving so your team can stay focused on high-value client work.`,
  ];
  const intros = [
    'Need help putting this into action?',
    'Want a partner to execute these ideas?',
    'Ready to accelerate your results?',
  ];
  const mentionCount = Math.min(maxCount, supportingSentences.length);
  const blocks: string[] = [];
  for (let i = 0; i < mentionCount; i++) {
    const intro = intros[i] || intros[intros.length - 1];
    const sentence = ensureSentence(supportingSentences[i]);
    const cta = websiteUrl ? ` [Learn more](${websiteUrl}).` : '';
    blocks.push(`> **${intro}** ${sentence}${cta}`);
  }
  return blocks;
}

function findBusinessMentionPositions(content: string, desiredCount: number): number[] {
  if (desiredCount <= 0) return [];
  
  // Exclude conclusion section from consideration
  const conclusionMatch = content.match(/(?:^|\n)##\s+Conclusion[^\n]*/i);
  const mainContent = conclusionMatch 
    ? content.substring(0, conclusionMatch.index || content.length)
    : content;
  const mainContentLength = mainContent.length;
  
  const headingMatches = [...mainContent.matchAll(/^##\s+[^\n]+/gm)];
  const positions: number[] = [];

  if (headingMatches.length > 1) {
    // Skip first section (intro) and filter out conclusion
    const usableMatches = headingMatches.slice(1).filter(match => {
      if (typeof match.index !== 'number') return false;
      // Make sure we're not in or near conclusion
      const headingText = match[0].toLowerCase();
      return !headingText.includes('conclusion') && match.index < mainContentLength;
    });
    
    if (usableMatches.length > 0) {
      const step = Math.max(1, Math.floor(usableMatches.length / desiredCount));
      for (let i = 0; i < usableMatches.length && positions.length < desiredCount; i += step) {
        const match = usableMatches[i];
        if (typeof match.index === 'number') {
          positions.push(match.index + match[0].length);
        }
      }
    }
  }

  if (positions.length === 0) {
    // Use fractions of main content only (not conclusion)
    const fallbackFractions =
      desiredCount === 1 ? [0.6] : desiredCount === 2 ? [0.45, 0.75] : [0.35, 0.6, 0.8];
    fallbackFractions.slice(0, desiredCount).forEach((fraction) => {
      positions.push(Math.min(mainContentLength, Math.floor(mainContentLength * fraction)));
    });
  }

  return positions.slice(0, desiredCount);
}

function adjustPositionToParagraph(content: string, position: number): number {
  if (position <= 0) return 0;
  const ahead = content.indexOf('\n\n', position);
  if (ahead === -1) {
    return content.length;
  }
  return ahead + 2;
}

