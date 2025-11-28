/**
 * Shared content generation prompts to avoid duplication
 * Used by both /api/ai/content-writer and /api/calendar/generate
 */

export type ContentLength = 'short' | 'medium' | 'long';

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
  businessDescription?: string; // User's business description for personalized CTA
  contentLength?: ContentLength; // User's preferred content length: 'short', 'medium', or 'long'
}

// Helper function to get word count and structure based on content length
function getContentLengthConfig(contentLength: ContentLength, isTest: boolean) {
  if (isTest) {
    return {
      targetWordCount: '200-300 words',
      wordCountDescription: 'concise test article (200-300 words) for quick preview',
      minWords: 200,
      maxWords: 300,
      h2Sections: '2-3',
      h3PerH2: '1-2',
      examplesCount: '1-2',
      tablesCount: '0-1 (optional)',
      faqCount: '2-3',
      proTipsCount: '1-2',
      introWords: '30-50',
      h2Words: '40-60',
      conclusionWords: '40-60',
      h3Words: '20-40',
      expansionMinWords: 200,
      expansionMaxWords: 300
    };
  }

  switch (contentLength) {
    case 'short':
      return {
        targetWordCount: '1,000-1,500 words',
        wordCountDescription: 'concise, snackable article (1,000-1,500 words) perfect for quick engagement',
        minWords: 1000,
        maxWords: 1500,
        h2Sections: '4-5',
        h3PerH2: '2-3',
        examplesCount: '4-6',
        tablesCount: '1-2 (optional)',
        faqCount: '5-7',
        proTipsCount: '2-3',
        introWords: '100-150',
        h2Words: '150-250',
        conclusionWords: '100-150',
        h3Words: '50-80',
        expansionMinWords: 1000,
        expansionMaxWords: 1500
      };
    case 'medium':
      return {
        targetWordCount: '2,000-3,000 words',
        wordCountDescription: 'balanced, well-structured article (2,000-3,000 words) with good depth',
        minWords: 2000,
        maxWords: 3000,
        h2Sections: '5-6',
        h3PerH2: '2-3',
        examplesCount: '6-8',
        tablesCount: '2-3',
        faqCount: '6-8',
        proTipsCount: '3-4',
        introWords: '150-200',
        h2Words: '250-350',
        conclusionWords: '150-200',
        h3Words: '80-120',
        expansionMinWords: 2000,
        expansionMaxWords: 3000
      };
    case 'long':
    default:
      return {
        targetWordCount: '3,800-4,200 words',
        wordCountDescription: 'comprehensive, in-depth article (3,800-4,200 words) optimized for SEO ranking',
        minWords: 3800,
        maxWords: 4200,
        h2Sections: '6-8',
        h3PerH2: '2-4',
        examplesCount: '10-12',
        tablesCount: '3-4 (REQUIRED)',
        faqCount: '8-10',
        proTipsCount: '4-6',
        introWords: '200-250',
        h2Words: '400-500',
        conclusionWords: '200-250',
        h3Words: '100-200',
        expansionMinWords: 3800,
        expansionMaxWords: 4200
      };
  }
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
    websiteUrl = '',
    businessDescription = '',
    contentLength = 'long'
  } = options;
  
  const isTestMode = isTest;
  const config = getContentLengthConfig(contentLength, isTestMode);
  const targetWordCount = config.targetWordCount;
  const wordCountDescription = config.wordCountDescription;

  return `You are an expert SEO content writer who creates comprehensive, engaging articles that rank well in search engines.

${keyword ? `PRIMARY KEYWORD/TOPIC: "${keyword}" - You MUST optimize the title and content for this specific keyword.` : ''}

AVAILABLE IMAGES (embed using Markdown):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

IMAGE AND VIDEO PLACEMENT RULES (CRITICAL - MUST FOLLOW):
- YOU MUST USE ALL PROVIDED IMAGES - distribute them evenly throughout the article
- Place images after relevant H2 sections or within H3 subsections where contextually appropriate
- DO NOT place all images at the beginning - spread them across the entire article
- DO NOT place images and videos directly next to each other
- Always include at least 2-3 paragraphs of text between any image and video
- Ensure substantial content (100+ words) between media elements
- Format: ![descriptive alt text](IMAGE_URL)
- If you have 4 images and 8 sections, aim to place images in sections 1, 3, 5, and 7

${youtubeVideos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${youtubeVideos.map((v, i) => `${i + 1}. ${v.title || 'Video'} - Video ID: ${v.id}`).join('\n')}` : ''}

Your articles follow this proven structure:

1. **Engaging Title**: Create a compelling, benefit-driven title with the keyword PLUS value proposition (e.g., numbers, outcomes, years). NEVER just use the keyword alone. CRITICAL: Always use the current year (${new Date().getFullYear()}) in titles when referencing years - NEVER use past years like 2024, 2023, etc.
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
- ${config.h2Sections} H2 sections (major topics) - simplified for test
- Each H2 should contain ${config.h3PerH2} H3 subsections
- Include ${config.examplesCount} specific examples with real numbers
- Optional: ${config.tablesCount} comparison table (not required for test)
- Create FAQ section with ${config.faqCount} questions
- Use > blockquotes for ${config.proTipsCount} pro tips
- Word count: ${targetWordCount} (TEST MODE - Quick Preview)
` : `
- ${config.h2Sections} H2 sections (major topics)
- Each H2 MUST contain ${config.h3PerH2} H3 subsections
- Include at least ${config.examplesCount} specific examples with real numbers
- Add ${config.tablesCount} professional comparison tables
- Create FAQ section with ${config.faqCount} questions
- Use > blockquotes for pro tips (at least ${config.proTipsCount} throughout)
- Word count: ${targetWordCount} (FULL GENERATION)
`}

MANDATORY SECTIONS:
${isTestMode ? `
1. Introduction with hook and overview (${config.introWords} words)
2. ${config.h2Sections} main H2 sections (each ${config.h2Words} words)
3. FAQ section (${config.faqCount} questions)
4. Conclusion with key takeaways and ${businessName} CTA (${config.conclusionWords} words)
` : `
1. Introduction with hook and overview (${config.introWords} words)
2. ${config.h2Sections} main H2 sections (each ${config.h2Words} words)
3. FAQ section (${config.faqCount} questions)
4. Conclusion with key takeaways and ${businessName} CTA (${config.conclusionWords} words)
`}

CONTENT DEPTH REQUIREMENTS:
${isTestMode ? `
- Each H3 subsection should be ${config.h3Words} words minimum
- Include brief step-by-step guides with 2-3 steps where applicable
- Add 1 real-world example
- Include some statistical data where relevant
- Keep sections very concise for quick testing
` : contentLength === 'short' ? `
- Each H3 subsection should be ${config.h3Words} words minimum
- Include step-by-step guides with 3-5 steps where applicable
- Add 1-2 real-world examples per section
- Include relevant statistical data and metrics
- Keep content focused and actionable
` : contentLength === 'medium' ? `
- Each H3 subsection should be ${config.h3Words} words minimum
- Include step-by-step guides with 4-6 steps where applicable
- Add 1-2 real-world examples per section
- Include good statistical data and metrics
- Provide balanced depth and coverage
` : `
- Each H3 subsection should be ${config.h3Words} words minimum
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

COMPARISON TABLES FORMAT${isTestMode ? ' (OPTIONAL for test - 0-1 table if needed):' : contentLength === 'short' ? ' (OPTIONAL - 1-2 tables if needed):' : contentLength === 'medium' ? ' (Add 2-3 tables):' : ' (MANDATORY - Add 3-4 tables):'}
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
[Create an engaging, benefit-driven title (55-65 characters) that:
- Includes the primary keyword naturally (not just the keyword alone)
- Promises a specific benefit, number, or outcome
- Uses power words like "Proven", "Ultimate", "Complete", "Essential", etc.
- Examples: "10 Proven SEO Tips to Boost Your Sales by 40%", "The Complete Guide to SEO Tips That Actually Boost Sales", "SEO Tips to Boost Your Sales: ${new Date().getFullYear()} Expert Strategies"
- AVOID: Just using the keyword as-is (e.g., "seo tips to boost your sales")]

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
  : `[Write 3-4 paragraphs (approximately 150-250 words total) with this EXACT structure:

**Paragraph 1 - Acknowledgment & Transition:**
Start with "While the strategies in this guide provide a solid foundation for [SPECIFIC TOPIC FROM ARTICLE], implementing [SPECIFIC CHALLENGE/TASK] requires expertise in [SPECIFIC SKILLS/KNOWLEDGE AREAS]. [SPECIFIC COMPLEX TASKS] can overwhelm business owners focused on daily operations."

**Paragraph 2 - Business Value Proposition:**
"${businessName} specializes in [SPECIFIC SERVICES RELATED TO ARTICLE TOPIC], handling everything from [SPECIFIC SERVICE 1] and [SPECIFIC SERVICE 2] to [SPECIFIC SERVICE 3] and [SPECIFIC SERVICE 4]. Our team manages the time-consuming aspects of [TOPIC] while you focus on serving customers and growing your business. We provide [SPECIFIC DELIVERABLES like 'detailed performance reporting, competitive analysis, and strategic recommendations'] based on your specific market conditions and business goals."
${businessDescription ? `NOTE: Use the following business description as context when writing this paragraph: "${businessDescription}" - incorporate the key services, expertise areas, and value propositions from this description into the paragraph naturally.` : ''}

**Paragraph 3 - Clear Call-to-Action:**
${websiteUrl ? `"Visit ${websiteUrl} to discover how our [SPECIFIC EXPERTISE] can [SPECIFIC OUTCOME RELATED TO ARTICLE TOPIC] and [SPECIFIC BENEFIT FOR READER]."` : `"Contact ${businessName} to discover how our [SPECIFIC EXPERTISE] can [SPECIFIC OUTCOME RELATED TO ARTICLE TOPIC] and [SPECIFIC BENEFIT FOR READER]."`}

CRITICAL FORMATTING REQUIREMENTS:
- Use "Partner with ${businessName} for Success" as the H3 heading (EXACTLY this format)
- Write in paragraph form (NOT bullet points) with natural transitions between paragraphs
- Reference SPECIFIC examples, strategies, or challenges from THIS article (e.g., if article is about "Google Business Profile optimization," mention that specifically)
- Make each paragraph flow naturally into the next
- Use the business name "${businessName}" at least 2-3 times throughout this section
- Include the website URL "${websiteUrl || 'your website'}" in the final call-to-action paragraph`}

CRITICAL: This ${businessName} section MUST:
- Reference SPECIFIC topics from the article (e.g., "the keyword research strategies," "the technical SEO challenges," "the content marketing approaches we covered")
- Explain HOW ${businessName} helps with THOSE SPECIFIC things (not just generic "success" or "results")
- Use concrete language about what ${businessName} actually does (e.g., "we handle everything from X to Y," "our team specializes in Z," "we provide A, B, and C")
- Make it clear WHY readers would need help with the specific challenges mentioned in this article
- Include a clear, actionable call-to-action with the website URL: "${websiteUrl || 'your website URL'}"
- Feel like a natural extension of the article, not a generic sales pitch
- Use the business name "${businessName}" naturally within this CTA section (appears 2-3 times)
- Avoid vague terms like "success," "results," "growth" without specifying what kind
- Instead use specific outcomes relevant to the article (e.g., "rank higher for competitive keywords," "reduce page load times," "build authority backlinks")
- Follow the 3-4 paragraph structure with natural flow between paragraphs

CRITICAL: DO NOT insert the business name "${businessName}" anywhere in the main article content (introduction, H2 sections, H3 subsections, or FAQ). The business name should ONLY appear in the "### Partner with ${businessName} for Success" subsection at the very end of the Conclusion. The main article should be general educational content without company mentions.

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
    isTest = false,
    contentLength = 'long'
  } = options;

  const isTestMode = isTest;
  const config = getContentLengthConfig(contentLength, isTestMode);
  const targetWordCount = config.targetWordCount;
  const wordCountDescription = config.wordCountDescription;

  return `Write ${isTestMode ? 'a brief test' : 'a comprehensive, SEO-optimized'} blog post about: "${keyword}"

PRIMARY KEYWORD: "${keyword}"
CONTENT TYPE: ${contentType}
TARGET AUDIENCE: ${targetAudience}
TONE: ${tone}
WORD COUNT: ${targetWordCount.replace(' words', '')}${isTestMode ? ' (TEST MODE - Quick Preview)' : ` (FULL GENERATION - ${contentLength.toUpperCase()})`}

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

TITLE REQUIREMENTS (CRITICAL):
- DO NOT just use the keyword as the title (e.g., avoid: "${keyword}")
- Instead, create an engaging title that includes the keyword PLUS value:
  * Add numbers: "10 ${keyword} That Actually Work"
  * Add year/timeframe: "${keyword}: ${new Date().getFullYear()} Expert Guide"
  * Add benefit/outcome: "${keyword} to Increase Revenue by 40%"
  * Add authority: "The Ultimate Guide to ${keyword}"
  * Add specificity: "Proven ${keyword} for Small Businesses"
- Keep title between 55-65 characters
- Make it click-worthy while maintaining SEO value

Follow the structure and requirements outlined in your system prompt. ${isTestMode 
    ? `For test mode: Create ${config.h2Sections} H2 sections, each with ${config.h3PerH2} H3 subsections, optionally include ${config.tablesCount} comparison table, and create a FAQ section with ${config.faqCount} questions. Keep everything concise.`
    : `Ensure you create ${config.h2Sections} H2 sections, each with ${config.h3PerH2} H3 subsections, include ${config.tablesCount} comparison tables, and create a FAQ section with ${config.faqCount} questions.`}`;
}

/**
 * Generate expansion prompt for content that's too short
 */
export function generateExpansionPrompt(
  currentContent: string, 
  businessName: string = 'our company', 
  websiteUrl: string = '',
  contentLength: ContentLength = 'long'
): string {
  const config = getContentLengthConfig(contentLength, false);
  
  return `Expand the following draft to ${config.expansionMinWords}-${config.expansionMaxWords} words while preserving structure.

CRITICAL EXPANSION REQUIREMENTS:
- Ensure you have ${config.h2Sections} H2 sections total (add more if needed)
- Every H2 MUST have at least ${config.h3PerH2} H3 subsections
- Each H3 subsection should be ${config.h3Words} words minimum
- Add ${config.examplesCount} real examples per major section with specific metrics
- Add ${config.tablesCount} professional comparison tables
- Expand FAQ to ${config.faqCount} questions
- Start each H2 section with a 1-2 paragraph introduction (${config.introWords} words)
- Include step-by-step guides with ${contentLength === 'short' ? '3-5' : contentLength === 'medium' ? '4-6' : '5-10'} steps where applicable
- Add ${contentLength === 'short' ? '1-2' : contentLength === 'medium' ? '1-2' : '2-3'} real-world examples per section
- Include ${contentLength === 'short' ? 'relevant' : contentLength === 'medium' ? 'good' : 'extensive'} statistical data and metrics
- Add ${config.proTipsCount} pro tips as blockquotes (>) throughout
- Keep tone, headings, links, and embeds; do NOT add a Table of Contents
- Do NOT include labels like "Title:" or "Meta Description:" anywhere
- Keep paragraphs short (2–3 sentences), use data and tools

MANDATORY CONCLUSION STRUCTURE:
- Article MUST end with "## Conclusion" section
- Within Conclusion, include "### Partner with ${businessName} for Success" subsection
- The ${businessName} section should:
  * Reference specific challenges or strategies from THIS article
  * Explain how ${businessName} helps with THOSE specific things
  * Include a clear call-to-action: "${websiteUrl ? `Visit ${websiteUrl}` : `Contact ${businessName}`} to [specific action related to article topic]"
- If the draft doesn't have this, ADD IT at the end

TARGET: This should be a well-structured article of ${config.expansionMinWords}-${config.expansionMaxWords} words (${contentLength.toUpperCase()} LENGTH).

DRAFT TO EXPAND (Markdown):

${currentContent}`;
}
