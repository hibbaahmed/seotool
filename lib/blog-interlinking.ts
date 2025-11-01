/**
 * Blog Interlinking Utilities
 * Strategic functions for internal linking and content analysis
 */

export interface PostMetadata {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categories: string[];
  tags: string[];
  keywords?: string[];
}

/**
 * Extract keywords from text content using TF-IDF-like approach
 * Filters out common stop words and returns most relevant keywords
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'they', 'them', 'their', 'there', 'then', 'than', 'more', 'most', 'very',
    'much', 'many', 'some', 'any', 'all', 'each', 'every', 'other', 'another',
    'which', 'what', 'who', 'when', 'where', 'why', 'how', 'about', 'into',
    'through', 'during', 'including', 'against', 'among', 'throughout',
    'despite', 'towards', 'upon', 'concerning', 'to', 'of', 'in', 'for',
    'on', 'at', 'by', 'from', 'up', 'about', 'into', 'through', 'during'
  ]);

  // Extract words (minimum 4 characters, alphanumeric only)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4)
    .filter(w => !stopWords.has(w));

  // Count word frequency
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  // Sort by frequency and return top keywords
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Calculate content similarity between two posts
 * Uses multiple signals: categories, tags, keywords, and title overlap
 */
export function calculateContentSimilarity(
  post1: PostMetadata,
  post2: PostMetadata
): number {
  let score = 0;

  // Category matching (30% weight)
  const categories1 = new Set(post1.categories.map(c => c.toLowerCase()));
  const categories2 = new Set(post2.categories.map(c => c.toLowerCase()));
  const sharedCategories = [...categories1].filter(c => categories2.has(c));
  if (categories1.size > 0 && categories2.size > 0) {
    const categoryScore = sharedCategories.length / Math.max(categories1.size, categories2.size);
    score += categoryScore * 0.3;
  }

  // Tag matching (30% weight)
  const tags1 = new Set(post1.tags.map(t => t.toLowerCase()));
  const tags2 = new Set(post2.tags.map(t => t.toLowerCase()));
  const sharedTags = [...tags1].filter(t => tags2.has(t));
  if (tags1.size > 0 && tags2.size > 0) {
    const tagScore = sharedTags.length / Math.max(tags1.size, tags2.size);
    score += tagScore * 0.3;
  }

  // Keyword matching from content (25% weight)
  const keywords1 = post1.keywords || extractKeywords(post1.content + ' ' + post1.title, 15);
  const keywords2 = post2.keywords || extractKeywords(post2.content + ' ' + post2.title, 15);
  const keywords1Set = new Set(keywords1);
  const keywords2Set = new Set(keywords2);
  const sharedKeywords = [...keywords1Set].filter(k => keywords2Set.has(k));
  if (keywords1.length > 0 && keywords2.length > 0) {
    const keywordScore = sharedKeywords.length / Math.max(keywords1.length, keywords2.length);
    score += keywordScore * 0.25;
  }

  // Title keyword overlap (15% weight)
  const title1Words = new Set(
    post1.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const title2Words = new Set(
    post2.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  const sharedWords = [...title1Words].filter(w => title2Words.has(w));
  if (title1Words.size > 0 && title2Words.size > 0) {
    const titleScore = sharedWords.length / Math.max(title1Words.size, title2Words.size);
    score += titleScore * 0.15;
  }

  return score;
}

/**
 * Find the best link opportunities in content for a given target post
 * Returns array of text snippets that could link to the target post
 */
export function findLinkOpportunities(
  content: string,
  targetPost: PostMetadata,
  maxLinks: number = 3
): Array<{ text: string; position: number; relevance: number }> {
  const opportunities: Array<{ text: string; position: number; relevance: number }> = [];
  
  // Extract key phrases from target post
  const targetKeywords = targetPost.keywords || extractKeywords(
    targetPost.title + ' ' + targetPost.excerpt,
    10
  );
  const targetTitleWords = targetPost.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const allTargetTerms = [...new Set([...targetKeywords, ...targetTitleWords])];

  // Split content into sentences
  const sentences = content
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags temporarily
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  sentences.forEach((sentence, index) => {
    const sentenceLower = sentence.toLowerCase();
    
    // Check for keyword matches
    let matchCount = 0;
    let matchedTerms: string[] = [];
    
    allTargetTerms.forEach(term => {
      if (sentenceLower.includes(term.toLowerCase())) {
        matchCount++;
        matchedTerms.push(term);
      }
    });

    if (matchCount > 0) {
      // Calculate relevance based on number of matches and term importance
      const relevance = Math.min(
        (matchCount / allTargetTerms.length) * 100,
        100
      );

      // Extract a good linking snippet (prefer longer phrases)
      const snippet = sentence.length > 100 
        ? sentence.substring(0, 100) + '...'
        : sentence;

      opportunities.push({
        text: snippet,
        position: index,
        relevance,
      });
    }
  });

  // Sort by relevance and return top opportunities
  return opportunities
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxLinks);
}

/**
 * Hub-and-Spoke Strategy: Identify pillar content (hub) and supporting content (spokes)
 * Pillar posts are comprehensive guides, spokes are focused articles
 */
export interface ContentHierarchy {
  pillarPosts: PostMetadata[];
  spokePosts: PostMetadata[];
}

export function organizeContentHierarchy(
  posts: PostMetadata[]
): ContentHierarchy {
  // Identify pillar posts (typically longer, comprehensive content)
  const pillarPosts = posts
    .filter(post => {
      const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const hasComprehensiveTitle = /guide|complete|ultimate|comprehensive|everything/i.test(post.title);
      return wordCount > 2000 || hasComprehensiveTitle;
    })
    .sort((a, b) => {
      const wordCountA = a.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      const wordCountB = b.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      return wordCountB - wordCountA;
    });

  // Spoke posts are everything else
  const spokePosts = posts.filter(post => 
    !pillarPosts.some(pillar => pillar.id === post.id)
  );

  return { pillarPosts, spokePosts };
}

/**
 * Suggest which posts should link to pillar content
 */
export function suggestPillarLinks(
  spokePost: PostMetadata,
  pillarPosts: PostMetadata[]
): PostMetadata[] {
  return pillarPosts
    .map(pillar => ({
      pillar,
      similarity: calculateContentSimilarity(spokePost, pillar),
    }))
    .filter(item => item.similarity > 0.2) // Minimum similarity threshold
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 2) // Top 2 pillar posts
    .map(item => item.pillar);
}

