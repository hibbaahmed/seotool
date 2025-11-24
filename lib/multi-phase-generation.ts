/**
 * Multi-phase content generation utilities
 * Used by Inngest functions to generate content without Vercel timeout limits
 */

export interface MultiPhaseGenerationOptions {
  topic: string;
  userInput: string;
  imageUrls: string[];
  videos: Array<{ id: string; title: string; url: string }>;
  apiKey: string;
  businessName?: string; // User's business/company name for CTA
  websiteUrl?: string; // User's website URL
}

export interface MultiPhaseResult {
  outline: string;
  sections1to4: string;
  sections5to8: string;
  finalSections: string;
  fullContent: string;
}

/**
 * Generate content using multi-phase approach
 */
export async function generateMultiPhaseContent(
  options: MultiPhaseGenerationOptions
): Promise<MultiPhaseResult> {
  const { topic, userInput, imageUrls, videos, apiKey, businessName = 'our company', websiteUrl = '' } = options;

  // PHASE 1: Generate Outline (reduced from 4000 to stay under rate limit)
  console.log('📋 Phase 1: Generating outline...');
  const outline = await generatePhase(
    getOutlinePrompt(topic, userInput, businessName),
    apiKey,
    3000
  );
  console.log(`✅ Phase 1 complete. Outline length: ${outline.length} characters`);

  // PHASE 2: Generate Introduction + First 4 sections (reduced from 8000 to avoid rate limit)
  console.log('✍️ Phase 2: Writing introduction and sections 1-4...');
  const sections1to4 = await generatePhase(
    getSectionsPrompt(topic, userInput, outline, '1-4', imageUrls, videos, 'introduction and first 4 sections'),
    apiKey,
    5000
  );
  const words1to4 = sections1to4.split(/\s+/).length;
  console.log(`✅ Phase 2 complete. Length: ${sections1to4.length} chars, ~${words1to4} words`);

  // PHASE 3: Generate Sections 5-8 (reduced from 8000 to avoid rate limit)
  console.log('✍️ Phase 3: Writing sections 5-8...');
  const sections5to8 = await generatePhase(
    getSectionsPrompt(topic, userInput, outline, '5-8', imageUrls, videos, 'sections 5-8'),
    apiKey,
    5000
  );
  const words5to8 = sections5to8.split(/\s+/).length;
  console.log(`✅ Phase 3 complete. Length: ${sections5to8.length} chars, ~${words5to8} words`);

  // PHASE 4: Generate Remaining sections, FAQ, and Conclusion
  // Increased to 8000 tokens to ensure FAQ answers don't get cut off
  console.log('✍️ Phase 4: Writing final sections, FAQ, and conclusion...');
  const finalSections = await generatePhase(
    getFinalSectionsPrompt(topic, userInput, outline, imageUrls, videos, businessName, websiteUrl),
    apiKey,
    8000
  );
  const wordsFinal = finalSections.split(/\s+/).length;
  console.log(`✅ Phase 4 complete. Length: ${finalSections.length} chars, ~${wordsFinal} words`);

  // Combine all phases
  const fullContent = sections1to4 + '\n\n' + sections5to8 + '\n\n' + finalSections;

  // Calculate total word count
  const totalWords = words1to4 + words5to8 + wordsFinal;
  console.log(`🎉 Multi-phase generation complete! Total: ~${totalWords} words`);

  return {
    outline,
    sections1to4,
    sections5to8,
    finalSections,
    fullContent,
  };
}

/**
 * Sleep helper for rate limit backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a single phase using Claude API with retry logic
 */
async function generatePhase(
  systemPrompt: string,
  apiKey: string,
  maxTokens: number
): Promise<string> {
  // Use only valid, working models (404 models removed)
  const candidateModels = [
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-5-20250929',
  ];

  const errors: Array<{ model: string; error: string }> = [];

  for (const model of candidateModels) {
    // Try each model with exponential backoff for rate limits
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s
          console.log(`⏳ Retry ${attempt}/${maxRetries} for ${model} after ${backoffMs}ms`);
          await sleep(backoffMs);
        }
        
        console.log(`🤖 Trying model: ${model} (attempt ${attempt + 1}/${maxRetries})`);
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
              { role: 'user', content: 'Generate the content as specified in the system prompt.' }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content[0]?.text || '';
          console.log(`✅ Success with model: ${model}`);
          
          // Add delay to avoid hitting rate limits on next request
          // With 8,000 tokens/minute limit, wait 15s between phases to be safe
          await sleep(15000);
          
          return content;
        } else {
          const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
          const errorMsg = `HTTP ${response.status}: ${errorData.error?.message || response.statusText}`;
          
          // If 429 (rate limit), retry with backoff
          if (response.status === 429 && attempt < maxRetries - 1) {
            console.warn(`⚠️ Rate limit hit on ${model}, will retry...`);
            continue; // Try again with backoff
          }
          
          // If 404 (model not found), skip to next model immediately
          if (response.status === 404) {
            console.error(`❌ Model ${model} not found (404), skipping to next model`);
            errors.push({ model, error: `Model not found (404)` });
            break; // Skip retries, try next model
          }
          
          console.error(`❌ Model ${model} failed: ${errorMsg}`);
          errors.push({ model, error: errorMsg });
          
          if (attempt === maxRetries - 1) {
            break; // Max retries reached, try next model
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ Model ${model} threw exception: ${errorMsg}`);
        errors.push({ model, error: errorMsg });
        
        if (attempt === maxRetries - 1) {
          break; // Max retries reached, try next model
        }
      }
    }
  }

  // All models failed - provide detailed error
  const errorSummary = errors.map(e => `${e.model}: ${e.error}`).join('\n  ');
  throw new Error(`All Claude models failed for this phase:\n  ${errorSummary}`);
}

/**
 * Export generatePhase for use in separate Inngest steps
 */
export { generatePhase as generateSinglePhase };

/**
 * Generate outline prompt
 */
export function getOutlinePrompt(topic: string, userInput: string, businessName: string = 'our company'): string {
  return `You are creating a comprehensive article outline for a 3,800-4,200 word article about: "${topic}"

User requirements: ${userInput}

Generate a detailed outline with:

1. **Title**
Create an engaging, benefit-driven title (55-65 characters) that includes "${topic}" naturally but is NOT just the keyword alone.
Add value with numbers, outcomes, year, or authority terms.
Examples: "10 ${topic} That Drive Real Results", "${topic}: Complete ${new Date().getFullYear()} Guide", "Proven ${topic} for Maximum Impact"
CRITICAL: Always use the current year (${new Date().getFullYear()}) when referencing years in titles - NEVER use past years like 2024, 2023, etc.
AVOID: Just using "${topic}" as the title
DO NOT write "Title:" as a label in the output - just write the title text itself.

2. **Meta Description**
150-160 characters with primary keyword
DO NOT write "Meta Description:" as a label in the output - just write the description text itself.

3. **Introduction Structure** (target: 200-250 words)
- Hook paragraph
- Why this topic matters
- What readers will learn

4. **Main Content: 6-8 H2 Sections** (target: 3,000-3,400 words total)
For EACH H2 section:
- Create a descriptive H2 title with secondary keywords
- List 2-4 specific H3 subsections
- Note: Each H2 should yield 400-500 words
- Note: Each H3 should yield 100-150 words
- Indicate where to place HTML comparison tables (need 3-4 total across all sections)
- Indicate where to place images/videos
- IMPORTANT: Tables must be in HTML format, not Markdown

Example H2 structure:
## [H2 Title]
### [H3: Specific subtopic]
### [H3: Related technique]  
### [H3: Advanced strategy]
### [H3: Common mistakes]
### [H3: Best practices]

5. **FAQ Section** (target: 400-500 words)
- List 8-10 specific questions
- Questions should cover: How, Why, What, When, Where, Who
- Mix basic and advanced questions

6. **Conclusion** (target: 200-250 words)
- Key takeaways (4-5 bullet points specific to article content)
- Final actionable advice
- "Partner with ${businessName} for Success" subsection that:
  * References specific article topics/challenges
  * Explains how ${businessName} helps with THOSE specific things
  * Includes concrete, article-relevant call-to-action

FORMAT: Use markdown with ## for H2 and ### for H3. Be VERY specific with section titles - use actual descriptive titles, not placeholders.

CRITICAL: Create at least 10 H2 sections to reach the 7,000-8,000 word target.`;
}

/**
 * Generate sections prompt
 */
export function getSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  sectionRange: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  description: string
): string {
  return `You are writing the ${description} for a comprehensive pillar article about: "${topic}"

TARGET LENGTH FOR THIS PHASE: 2,000-2,500 words minimum

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES (YOU MUST USE ALL - distribute throughout this phase):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}
- Embed images at relevant points in your sections using: ![descriptive alt text](URL)
- Distribute images evenly - do not cluster them all in one section

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS (embed if relevant):
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write sections ${sectionRange} according to the outline above. Follow this structure EXACTLY:

FOR EACH H2 SECTION (target: 400-550 words per H2):

## [H2 Title from Outline]

Opening paragraph (70-100 words):
- Introduce the concept
- Explain why it matters
- What readers will learn in this section

### [H3 Subsection 1 from Outline]

**Bold opening sentence that summarizes this subsection**

Write 100-130 words covering:
- Step-by-step explanation or detailed breakdown
- Specific example with real numbers (e.g., "increases engagement by 45%")
- Tool names, metrics, data points
- Before/after scenario if applicable

### [H3 Subsection 2 from Outline]

**Bold opening sentence**

Write 100-130 words covering:
- Build on previous subsection
- More detailed guidance
- Another specific example with data
- Comparison: "Method A vs Method B"

### [H3 Subsection 3 from Outline]

**Bold opening sentence**

Write 100-130 words covering:
- Advanced technique or alternative approach
- Case study or real-world application
- Pro tip in blockquote: > **Pro Tip:** [advice]

### [H3 Subsection 4 from Outline]

**Bold opening sentence**

Write 100-130 words covering:
- Common mistakes to avoid
- Best practices
- Troubleshooting advice

### [H3 Subsection 5 from Outline]

**Bold opening sentence**

Write 100-130 words covering:
- Expert insights or industry trends
- Future outlook or emerging techniques
- Actionable takeaway

[Add comparison table if outline indicates one should go here]

### 5-Point Comparison: [Descriptive Title]

<table>
<thead>
<tr>
<th>Approach/Method</th>
<th>Complexity</th>
<th>Time Required</th>
<th>Cost</th>
<th>Best For</th>
<th>Key Benefit</th>
</tr>
</thead>
<tbody>
<tr>
<td>Option 1</td>
<td>Low</td>
<td>1-2 hours</td>
<td>Free</td>
<td>Beginners</td>
<td>Quick setup</td>
</tr>
<tr>
<td>Option 2</td>
<td>Medium</td>
<td>3-5 hours</td>
<td>$50-100</td>
<td>Professionals</td>
<td>Advanced features</td>
</tr>
<tr>
<td>Option 3</td>
<td>High</td>
<td>1-2 days</td>
<td>$200+</td>
<td>Enterprises</td>
<td>Full customization</td>
</tr>
</tbody>
</table>

Transition paragraph (30-50 words) connecting to the next section.

FORMATTING REQUIREMENTS:
- Use **bold** for key terms on first mention
- Use bullet points for lists of 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
- Use HTML tables (with <table>, <thead>, <tbody>, <tr>, <th>, <td> tags) - NEVER use Markdown pipe tables
- Keep paragraphs 3-4 sentences max
- Use second-person ("you", "your")
- Conversational but authoritative tone

CRITICAL REQUIREMENTS:
- Write ALL sections indicated in the range (${sectionRange})
- Each H2 MUST be 400-550 words (not more)
- Each H3 MUST be 100-130 words (not more)
- Include specific numbers, metrics, and examples in every subsection
- Do NOT include labels like "Title:", "Meta Description:", "Introduction:", "Section 1:", "Content:", etc.
- Start directly with ## headings from the outline or paragraph text
- Do NOT skip sections - write every H2 and H3 from the outline
- Do NOT include instruction markers like "[Write...]", "[Add...]", "[Insert...]", etc.
- Do NOT include orphaned table headers without data rows - every table must be complete
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments
- STAY WITHIN 1,200-1,400 word limit for this phase

WORD COUNT TARGET: 1,200-1,400 words for this phase (not more). Count carefully and ensure you stay within this target.`;
}

/**
 * Generate final sections prompt
 */
export function getFinalSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>,
  businessName: string = 'our company',
  websiteUrl: string = ''
): string {
  return `You are writing the final sections of a comprehensive pillar article about: "${topic}"

TARGET LENGTH FOR THIS PHASE: 1,500-1,800 words (not more)

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES (YOU MUST USE ALL remaining images in this final phase):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}
- Embed images at relevant points using: ![descriptive alt text](URL)
- Use any images not yet used in previous phases

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write the following sections according to the outline:

PART 1: REMAINING H2 SECTIONS (if sections 9-12 exist in outline)

For each remaining H2 section, follow the same structure:
- H2 heading (from outline)
- Opening paragraph (70-100 words)
- 4-5 H3 subsections (100-130 words each)
- Each H3 starts with a **bold summary sentence**
- Include specific examples, data, metrics
- Add comparison tables where indicated
- Use > blockquotes for pro tips

Target: 400-550 words per H2 section

PART 2: FAQ SECTION (target: 800-1,000 words)

## FAQ

Write 10-12 comprehensive questions and answers. Format:

**Q: How do [specific action] for [specific outcome]?**

[Opening answer sentence providing direct response]

[Second paragraph with more detail, specific examples, and data]

Target: 50-70 words per FAQ answer

Example questions to cover:
- How to get started (beginner question)
- What are the costs/requirements (practical question)
- Why choose X over Y (comparison question)
- When is the best time to (timing question)
- Where to find resources (resource question)
- Who should use this (audience question)
- What are common mistakes (troubleshooting question)
- How to measure success (metrics question)
- What's the future outlook (trend question)
- How does it compare to alternatives (competitive question)

PART 3: CONCLUSION (target: 350-450 words)

## Conclusion

Write a comprehensive conclusion with:

Paragraph 1 (70-90 words):
- Recap the main transformation or value proposition
- Emphasize the impact discussed in the article

Paragraph 2 (60-80 words):
- Key takeaways in bullet format:
  - Takeaway 1 with specific metric or insight
  - Takeaway 2 with actionable advice
  - Takeaway 3 with forward-looking perspective
  - Takeaway 4 with practical next step

Paragraph 3 (70-90 words):
- Discuss the future potential or next evolution
- Connect to broader trends

### Partner with ${businessName} for Success

Paragraph 4 (120-150 words):
- Open by referencing 2-3 SPECIFIC challenges, strategies, or pain points from THIS article (use actual concepts discussed)
- Explain how ${businessName} provides SPECIFIC solutions to THOSE challenges (not generic "help" or "success")
- Detail what ${businessName} actually does (concrete services/support related to this article's topic)
- Use specific terminology from the article (e.g., if article covers "keyword research, technical SEO, and link building" - reference those)
- Quantify or specify the support (e.g., "handle everything from X to Y," "provide Z," "specialize in A")
- End with a specific call-to-action tied to the article topic
- Example CTAs: "${websiteUrl ? `Visit ${websiteUrl}` : `Contact ${businessName}`} to [implement these strategies/solve this challenge/get expert guidance on X]"

CRITICAL: The ${businessName} section MUST:
- Reference ACTUAL topics, tools, strategies, or challenges mentioned in this specific article
- Explain HOW ${businessName} solves THOSE SPECIFIC problems (not just "provides expertise")
- Use concrete, specific language about services (avoid vague "success," "results," "growth")
- Make it clear what readers get (e.g., "we handle keyword research and content optimization" vs "we help you grow")
- Connect logically: "You learned about X, Y, Z → We help with X, Y, Z → Here's how to get started"
- Feel like the article's natural conclusion, not a bolted-on ad
- Use the business name "${businessName}" naturally within this CTA section
- Be specific to this article's content (a blog about SEO should have different CTA than one about email marketing)

CRITICAL: DO NOT insert the business name "${businessName}" anywhere in the main article content (introduction, H2 sections, H3 subsections, or FAQ). The business name should ONLY appear in the "### Partner with ${businessName} for Success" subsection at the very end of the Conclusion. The main article should be general educational content without company mentions.

FORMATTING REQUIREMENTS:
- Use **bold** for emphasis
- Use HTML tables (with <table>, <thead>, <tbody>, <tr>, <th>, <td> tags) - NEVER use Markdown pipe tables
- Keep paragraphs 3-4 sentences max
- Second-person tone ("you", "your")
- No section labels like "Title:", "Meta Description:", "Introduction:", "Section 1:" - start with ## headings or paragraph text directly
- Include specific data and examples in FAQ answers

CRITICAL REQUIREMENTS:
- Write ALL remaining H2 sections from the outline
- Write 10-12 FAQ questions (not more)
- Each FAQ answer must be 50-70 words (not more)
- Conclusion must be 350-450 words total (including ${businessName} section)
- MANDATORY: Include "### Partner with ${businessName} for Success" subsection in Conclusion with clear CTA
- Do NOT include "SEO Suggestions" or "Image suggestions" sections
- Do NOT end with internal linking suggestions
- Do NOT include instruction markers like "# Remaining H2 Sections", "[Write...]", "[Add...]", etc.
- Do NOT include orphaned table headers without data rows
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments
- STAY WITHIN 1,200-1,400 word limit for this phase

WORD COUNT TARGET: 1,200-1,400 words for this phase (not more). Count carefully and ensure you stay within this target.`;
}

