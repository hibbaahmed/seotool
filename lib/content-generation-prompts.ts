/**
 * Shared content generation prompts to avoid duplication
 * Used by both /api/ai/content-writer and /api/calendar/generate
 */

export interface ContentPromptOptions {
  keyword?: string;
  primaryKeywords?: string[];
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  contentType?: string;
  targetAudience?: string;
  tone?: string;
  imageUrls?: string[];
  youtubeVideos?: Array<{ id: string; title?: string; url?: string }>;
  isTest?: boolean; // Flag for test generation (shorter content)
  businessName?: string; // User's business/company name for CTA
  websiteUrl?: string; // User's website URL
}

/**
 * Generate the system prompt for content generation
 */
export function generateContentSystemPrompt(options: ContentPromptOptions): string {
  const {
    keyword = '',
    imageUrls = [],
    youtubeVideos = [],
    isTest = false,
    businessName = 'our company',
    websiteUrl = ''
  } = options;
  
  const isTestMode = isTest;
  const targetWordCount = isTestMode ? '200-300 words' : '6,000-8,500 words';
  const wordCountDescription = isTestMode 
    ? 'concise test article (200-300 words) for quick preview'
    : 'comprehensive, in-depth article (6,000-8,500 words)';

  return `You are an expert SEO content writer who creates comprehensive, engaging articles that rank well in search engines.

${keyword ? `PRIMARY KEYWORD/TOPIC: "${keyword}" - You MUST optimize the title and content for this specific keyword.` : ''}

AVAILABLE IMAGES (embed using Markdown):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

IMAGE AND VIDEO PLACEMENT RULES:
- DO NOT place images and videos directly next to each other
- Always include at least 2-3 paragraphs of text between any image and video
- Distribute images and videos throughout the article, not clustered together
- Place images after relevant H2 sections or within H3 subsections
- Place videos after relevant H2 sections or key paragraphs where they add value
- Ensure substantial content (100+ words) between media elements

${youtubeVideos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${youtubeVideos.map((v, i) => `${i + 1}. ${v.title || 'Video'} - Video ID: ${v.id}`).join('\n')}` : ''}

Your articles follow this proven structure:

1. **Engaging Title**: Include the main keyword naturally, make it benefit-driven
2. **Hook Introduction**: Start with a pain point or surprising fact
3. **Hierarchical Content**: H2 sections with 3-5 H3 subsections each
4. **Data-Driven Examples**: Include specific numbers, tool names, real scenarios
5. **Visual Content**: Embed images after H2 sections, videos where relevant
6. **Pro Tips**: Use blockquotes (>) for insider advice
7. **FAQ Section**: Answer 10-15 common questions directly
8. **Actionable Conclusion**: Clear next steps

Writing style:
- Conversational and authoritative
- Second person ("you", "your")
- Short paragraphs (3-4 sentences)
- Active voice
- Include contractions
- Address reader pain points directly

CRITICAL STRUCTURE REQUIREMENTS:
${isTestMode ? `
- 2-3 H2 sections (major topics) - simplified for test
- Each H2 should contain 1-2 H3 subsections
- Include 1-2 specific examples with real numbers
- Optional: 1 comparison table (not required for test)
- Create FAQ section with 2-3 questions
- Use > blockquotes for 1-2 pro tips
- Word count: 200-300 words (TEST MODE - Quick Preview)
` : `
- 8-12 H2 sections (major topics)
- Each H2 MUST contain 3-5 H3 subsections
- Include at least 10-15 specific examples with real numbers
- Add 4-6 professional comparison tables (REQUIRED)
- Create FAQ section with 10-15 questions
- Use > blockquotes for pro tips (at least 5-8 throughout)
- Word count: 6,000-8,500 words (FULL GENERATION)
`}

MANDATORY SECTIONS:
${isTestMode ? `
1. Introduction with hook and overview (30-50 words)
2. 2-3 main H2 sections (each 40-60 words)
3. FAQ section (2-3 questions)
4. Conclusion with key takeaways and Case Quota CTA (40-60 words)
` : `
1. Introduction with hook and overview (200-300 words)
2. 8-12 main H2 sections (each 400-600 words)
3. FAQ section (10-15 questions)
4. Conclusion with key takeaways and Case Quota CTA (200-300 words)
`}

CONTENT DEPTH REQUIREMENTS:
${isTestMode ? `
- Each H3 subsection should be 20-40 words minimum
- Include brief step-by-step guides with 2-3 steps where applicable
- Add 1 real-world example
- Include some statistical data where relevant
- Keep sections very concise for quick testing
` : `
- Each H3 subsection should be 100-200 words minimum
- Include step-by-step guides with 5-10 steps where applicable
- Add 2-3 real-world examples per section
- Include extensive statistical data and metrics
- Provide comprehensive depth and coverage
`}

${isTestMode ? `
ADDITIONAL SECTIONS TO INCLUDE (optional for test mode - keep minimal):
- Skip additional sections for test mode - focus on core content only
` : `
ADDITIONAL SECTIONS TO INCLUDE:
- ## Common Challenges and Solutions (with 2-3 H3 subsections)
- ## Tools and Resources (with 2-3 H3 subsections covering specific tools)
`}

${isTestMode ? `
EXPANSION TECHNIQUES (simplified for test):
- Keep explanations brief and to the point
- Include 1-2 examples per concept (maximum)
- Add brief step-by-step processes with 2-3 steps where applicable
- Skip advanced expansion techniques for test mode
` : `
EXPANSION TECHNIQUES:
- Start each H2 section with a 2-3 paragraph introduction explaining importance
- Include multiple examples per concept (minimum 2-3 examples per H3)
- Add numbered step-by-step processes whenever explaining "how to"
- Include comparison scenarios: "Method A vs Method B vs Method C"
- Add "What If" scenarios exploring edge cases
- Include troubleshooting subsections
- Add timeline/roadmap sections showing progression
- Include budget/resource allocation guidance where relevant
`}

${isTestMode ? `
STORYTELLING ELEMENTS (simplified for test):
- Use brief, concise examples
- Skip lengthy case studies for test mode
- Keep storytelling minimal and focused
` : `
STORYTELLING ELEMENTS:
- Begin sections with relatable scenarios or case studies
- Include before/after transformations with specific metrics
- Add mini case studies (150-200 words each) throughout
- Include quotes or insights (even if hypothetical expert opinions)
- Add "real-world application" examples
`}

COMPARISON TABLES FORMAT${isTestMode ? ' (OPTIONAL for test - 0-1 table if needed):' : ' (MANDATORY - Add 4-6 tables):'}
- Create titled comparison tables with descriptive headings
- Format: Use H3 heading with title like "10-Point Comparison: [Topic]" or "[Number]-Point Comparison: [Topic]"
- Include 5-10 comparison rows with 4-6 columns
- Common column headers: Feature/Approach/Method, Complexity, Resources Needed, Outcomes/Results, Use Cases, Advantages/Benefits, Time Required, Cost
- Use proper markdown table format:

  ### [Number]-Point Comparison: [Topic Description]
  
  | [Row Header Column] | Column 1 | Column 2 | Column 3 | Column 4 | Column 5 |
  | --- | --- | --- | --- | --- | --- |
  | Option/Method 1 | Value/details | Value/details | Value/details | Value/details | Value/details |
  | Option/Method 2 | Value/details | Value/details | Value/details | Value/details | Value/details |
  | Option/Method 3 | Value/details | Value/details | Value/details | Value/details | Value/details |
  
- CRITICAL: Each table cell should contain SHORT data values ONLY (1-10 words maximum per cell)
- NEVER put paragraph descriptions or explanatory text inside table rows
- If you have explanatory text about the table, place it AFTER the table as a regular paragraph
- Example BAD: | The transition from ad-hoc video creation... | (too long, paragraph text)
- Example GOOD: | Automated Pipeline | then after table: "The transition from ad-hoc video creation..."
- Place tables strategically after relevant H2 sections or within H3 subsections
- Include real metrics, comparisons, and actionable data
- Make tables useful for reader decision-making

FORMATTING:
- Use **bold** ONLY for FAQ questions (Q: format) and key technical terms on first mention (sparingly)
- DO NOT bold entire sentences or paragraph openings
- DO NOT bold subheading sentences - use regular text
- Use bullet points for lists with 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

TARGET LENGTH: This should be a ${wordCountDescription} (${targetWordCount}). 
${isTestMode 
  ? 'Keep it very concise and focused. Provide a quick preview of the topic with essential information only.'
  : 'Provide comprehensive, in-depth coverage. Every section should provide substantial value with detailed explanations, examples, and actionable insights.'}

STRICT OUTPUT FORMAT:
1. **Title**
[SEO-optimized title with primary keyword, 55-65 characters]

2. **Meta Description**
[150-160 characters with primary keyword]

3. **Content**
# [Same title]

${isTestMode ? `
[Hook paragraph addressing pain point - 1-2 sentences]

[Why this matters - 1-2 sentences]

## H2: [Secondary Keyword Variation]

[Opening paragraph explaining the concept - 2-3 sentences]

### H3: Specific Technique or Tool

[Brief explanation with example - 2-3 sentences]

### H3: Related Approach

[Brief explanation - 2-3 sentences]

${isTestMode ? '' : '> **Pro Tip:** [Insider advice in blockquote]'}
` : `
[Hook paragraph addressing pain point - 2-3 sentences]

[Why this matters - 2-3 sentences]

[What they'll learn - 2-3 sentences]

## H2: [Secondary Keyword Variation]

[Opening paragraph explaining the concept - 3-4 sentences]

### H3: Specific Technique or Tool

[Detailed explanation with example and real numbers - include metrics like "5,000/month" or "3x increase"]

### H3: Related Approach

[Build on previous subsection - include pro tip or best practice]

> **Pro Tip:** [Insider advice in blockquote]

### H3: Advanced Strategy

[Further depth with before/after comparison or data table]
`}

[Transition paragraph to next section]

## H2: [Next Major Topic]

[Continue pattern with 3-5 H3 subsections each]

## FAQ

**Q: [Natural language question]**

[Direct answer in 2-3 sentences, then expand with context - do NOT use bold formatting in answers]

**Q: [Another question]**

[Answer with specific details and keywords - do NOT use bold formatting in answers]

[Continue with ${isTestMode ? '2-3' : '10-15'} total questions]

## Conclusion

[Closing paragraph with ${isTestMode ? '2-3' : '3-4'} key takeaways in bullets]

### Partner with ${businessName} for Success

${isTestMode 
  ? `[1-2 sentences that reference SPECIFIC strategies, tools, or challenges from this article and explain how ${businessName} helps implement them. Include a clear call to action.]`
  : `[3-4 sentences that:
1. Reference 2-3 SPECIFIC challenges, strategies, or pain points discussed in THIS article (use actual examples from the content)
2. Explain how ${businessName} helps readers overcome THOSE SPECIFIC obstacles with concrete solutions
3. Mention specific services, expertise areas, or support that directly relate to the article's topic
4. End with a compelling, specific call-to-action]`}

CRITICAL: This ${businessName} section MUST:
- Reference SPECIFIC topics from the article (e.g., "the keyword research strategies," "the technical SEO challenges," "the content marketing approaches we covered")
- Explain HOW ${businessName} helps with THOSE SPECIFIC things (not just generic "success" or "results")
- Use concrete language about what ${businessName} actually does (e.g., "we handle everything from X to Y," "our team specializes in Z," "we provide A, B, and C")
- Make it clear WHY readers would need help with the specific challenges mentioned in this article
- Include a clear, actionable call-to-action (e.g., "${websiteUrl ? `Visit ${websiteUrl}` : `Contact ${businessName}`} to [specific action related to article topic]")
- Feel like a natural extension of the article, not a generic sales pitch
- Use the business name "${businessName}" naturally throughout
- Avoid vague terms like "success," "results," "growth" without specifying what kind
- Instead use specific outcomes relevant to the article (e.g., "rank higher for competitive keywords," "reduce page load times," "build authority backlinks")

CRITICAL RULES:
- NEVER split words across lines (e.g., "Generatio\nn" is FORBIDDEN). If a word would wrap, write it fully on the next line.
- Headings (##/###) MUST be complete on ONE line. If too long, rewrite shorter instead of breaking.
- Use proper Markdown only (## for H2, ### for H3, - for bullets, **bold** as needed).
- DO NOT use section labels like "Introduction:", "Call-to-Action:", or "Understanding [Topic]:" before paragraphs. Start paragraphs immediately after the main title and after subheadings.
- Keep paragraphs short (1–3 sentences). Use blank lines between blocks.
- Tone: professional yet conversational, 8th–10th grade, active voice.
- MANDATORY: Every article MUST end with a "## Conclusion" section that includes a "### Partner with ${businessName} for Success" subsection with clear CTA using the business name.
`;
}

/**
 * Generate the user prompt for keyword-based content generation (used by calendar)
 */
export function generateKeywordContentPrompt(options: ContentPromptOptions): string {
  const {
    keyword = '',
    primaryKeywords = [],
    secondaryKeywords = [],
    longTailKeywords = [],
    contentType = 'blog post',
    targetAudience = 'General audience',
    tone = 'professional',
    imageUrls = [],
    isTest = false
  } = options;

  const isTestMode = isTest;
  const targetWordCount = isTestMode ? '200-300 words' : '6,000-8,500 words';
  const wordCountDescription = isTestMode 
    ? 'concise test article (200-300 words) for quick preview'
    : 'comprehensive, in-depth article (6,000-8,500 words)';

  return `Write ${isTestMode ? 'a brief test' : 'a comprehensive, SEO-optimized'} blog post about: "${keyword}"

PRIMARY KEYWORD: "${keyword}"
CONTENT TYPE: ${contentType}
TARGET AUDIENCE: ${targetAudience}
TONE: ${tone}
WORD COUNT: ${targetWordCount}${isTestMode ? ' (TEST MODE - Quick Preview)' : ' (FULL GENERATION)'}

TARGET LENGTH: This should be a ${wordCountDescription} (${targetWordCount}). 
${isTestMode 
  ? 'Keep it very concise and focused. Provide a quick preview of the topic with essential information only. This is for testing purposes.'
  : 'Provide comprehensive, in-depth coverage. Every section should provide substantial value with detailed explanations, examples, and actionable insights.'}

${primaryKeywords.length > 0 ? `
PRIMARY KEYWORDS (use in title, H1, first paragraph, conclusion):
${primaryKeywords.slice(0, 3).map(k => `- "${k}"`).join('\n')}
` : ''}
${secondaryKeywords.length > 0 ? `
SECONDARY KEYWORDS (use in H2 headings, throughout body):
${secondaryKeywords.slice(0, 10).map(k => `- "${k}"`).join('\n')}
` : ''}
${longTailKeywords.length > 0 ? `
LONG-TAIL KEYWORDS (use in H3 subsections, FAQ questions, specific examples):
${longTailKeywords.slice(0, 15).map(k => `- "${k}"`).join('\n')}
` : ''}

AVAILABLE IMAGES (embed using Markdown):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

KEYWORD INTEGRATION:
- Primary keyword "${keyword}": Naturally in title, first paragraph, one H2, conclusion
- Variations: Use semantic variations in H2/H3 headings
- LSI keywords: Naturally sprinkle related terms throughout
- Avoid exact-match repetition (sounds robotic)

Follow the structure and requirements outlined in your system prompt. ${isTestMode 
  ? 'For test mode: Create 2-3 H2 sections, each with 1-2 H3 subsections, optionally include 1 comparison table, and create a FAQ section with 2-3 questions. Keep everything concise.'
  : 'Ensure you create 8-12 H2 sections, each with 3-5 H3 subsections, include 4-6 comparison tables, and create a FAQ section with 10-15 questions.'}`;
}

/**
 * Generate expansion prompt for content that's too short
 */
export function generateExpansionPrompt(currentContent: string): string {
  return `Expand the following draft to 500-800 words while preserving structure (TESTING MODE).

CRITICAL EXPANSION REQUIREMENTS:
- Ensure you have 3-4 H2 sections total (add more if needed)
- Every H2 MUST have at least 2-3 H3 subsections
- Each H3 subsection should be 50-100 words minimum
- Add 1-2 more real examples per major section with specific metrics
- Add at least 1-2 professional comparison tables (aim for 1-2 total)
- Expand FAQ to 3-5 questions
- Start each H2 section with a 1-2 paragraph introduction (50-100 words)
- Include step-by-step guides with 3-5 steps where applicable
- Add 1-2 real-world examples
- Include some statistical data where relevant
- Add 2-3 pro tips as blockquotes (>) throughout
- Keep tone, headings, links, and embeds; do NOT add a Table of Contents
- Do NOT include labels like "Title:" or "Meta Description:" anywhere
- Keep paragraphs short (2–3 sentences), use data and tools

MANDATORY CONCLUSION STRUCTURE:
- Article MUST end with "## Conclusion" section
- Within Conclusion, include "### Partner with Case Quota for Success" subsection
- The Case Quota section should connect to the article topic and include a clear call-to-action
- If the draft doesn't have this, ADD IT at the end

TARGET: This should be a concise, well-structured article of 500-800 words (TESTING MODE).

DRAFT TO EXPAND (Markdown):

${currentContent}`;
}

