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
  const { topic, userInput, imageUrls, videos, apiKey } = options;

  // PHASE 1: Generate Outline (reduced from 4000 to stay under rate limit)
  console.log('📋 Phase 1: Generating outline...');
  const outline = await generatePhase(
    getOutlinePrompt(topic, userInput),
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
    getFinalSectionsPrompt(topic, userInput, outline, imageUrls, videos),
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
export function getOutlinePrompt(topic: string, userInput: string): string {
  return `You are creating a comprehensive article outline for a 6,000-8,500 word pillar article about: "${topic}"

User requirements: ${userInput}

Generate a detailed outline with:

1. **Title**
SEO-optimized title (55-65 characters with primary keyword "${topic}")
DO NOT write "Title:" as a label in the output - just write the title text itself.

2. **Meta Description**
150-160 characters with primary keyword
DO NOT write "Meta Description:" as a label in the output - just write the description text itself.

3. **Introduction Structure** (target: 400-600 words)
- Hook paragraph
- Why this topic matters
- What readers will learn

4. **Main Content: 10-12 H2 Sections** (target: 6,000-7,000 words total)
For EACH H2 section:
- Create a descriptive H2 title with secondary keywords
- List 4-5 specific H3 subsections
- Note: Each H2 should yield 600-800 words
- Note: Each H3 should yield 150-200 words
- Indicate where to place comparison tables (need 4-6 total across all sections)
- Indicate where to place images/videos

Example H2 structure:
## [H2 Title]
### [H3: Specific subtopic]
### [H3: Related technique]  
### [H3: Advanced strategy]
### [H3: Common mistakes]
### [H3: Best practices]

5. **FAQ Section** (target: 1,200-1,500 words)
- List 12-15 specific questions
- Questions should cover: How, Why, What, When, Where, Who
- Mix basic and advanced questions

6. **Conclusion** (target: 400-500 words)
- Key takeaways (4-5 bullet points)
- Final actionable advice
- Call to action

FORMAT: Use markdown with ## for H2 and ### for H3. Be VERY specific with section titles - use actual descriptive titles, not placeholders.

CRITICAL: Create at least 10 H2 sections to reach the 6,000+ word target.`;
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

AVAILABLE IMAGES (embed 1-2 per section):
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS (embed if relevant):
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write sections ${sectionRange} according to the outline above. Follow this structure EXACTLY:

FOR EACH H2 SECTION (target: 600-800 words per H2):

## [H2 Title from Outline]

Opening paragraph (100-150 words):
- Introduce the concept
- Explain why it matters
- What readers will learn in this section

### [H3 Subsection 1 from Outline]

**Bold opening sentence that summarizes this subsection**

Write 150-200 words covering:
- Step-by-step explanation or detailed breakdown
- Specific example with real numbers (e.g., "increases engagement by 45%")
- Tool names, metrics, data points
- Before/after scenario if applicable

### [H3 Subsection 2 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Build on previous subsection
- More detailed guidance
- Another specific example with data
- Comparison: "Method A vs Method B"

### [H3 Subsection 3 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Advanced technique or alternative approach
- Case study or real-world application
- Pro tip in blockquote: > **Pro Tip:** [advice]

### [H3 Subsection 4 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Common mistakes to avoid
- Best practices
- Troubleshooting advice

### [H3 Subsection 5 from Outline]

**Bold opening sentence**

Write 150-200 words covering:
- Expert insights or industry trends
- Future outlook or emerging techniques
- Actionable takeaway

[Add comparison table if outline indicates one should go here]

### 5-Point Comparison: [Descriptive Title]

| Approach/Method | Complexity | Time Required | Cost | Best For | Key Benefit |
|-----------------|------------|---------------|------|----------|-------------|
| Option 1 | Low | 1-2 hours | Free | Beginners | Quick setup |
| Option 2 | Medium | 3-5 hours | $50-100 | Professionals | Advanced features |
| Option 3 | High | 1-2 days | $200+ | Enterprises | Full customization |

Transition paragraph (50-75 words) connecting to the next section.

FORMATTING REQUIREMENTS:
- Use **bold** for key terms on first mention
- Use bullet points for lists of 3+ items
- Embed images: ![descriptive alt](URL)
- Embed videos: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
- Keep paragraphs 3-4 sentences max
- Use second-person ("you", "your")
- Conversational but authoritative tone

CRITICAL REQUIREMENTS:
- Write ALL sections indicated in the range (${sectionRange})
- Each H2 MUST be 600-800 words minimum
- Each H3 MUST be 150-200 words minimum
- Include specific numbers, metrics, and examples in every subsection
- Do NOT include labels like "Title:", "Meta Description:", "Introduction:", "Section 1:", "Content:", etc.
- Start directly with ## headings from the outline or paragraph text
- Do NOT skip sections - write every H2 and H3 from the outline
- Do NOT include instruction markers like "[Write...]", "[Add...]", "[Insert...]", etc.
- Do NOT include orphaned table headers without data rows - every table must be complete
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments

WORD COUNT TARGET: 2,000-2,500 words for this phase. If you write less, you are failing the requirement.`;
}

/**
 * Generate final sections prompt
 */
export function getFinalSectionsPrompt(
  topic: string,
  userInput: string,
  outline: string,
  imageUrls: string[],
  videos: Array<{ id: string; title: string; url: string }>
): string {
  return `You are writing the final sections of a comprehensive pillar article about: "${topic}"

TARGET LENGTH FOR THIS PHASE: 2,000-2,500 words minimum

User requirements: ${userInput}

Article outline to follow:
${outline}

AVAILABLE IMAGES:
${imageUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}

${videos.length > 0 ? `AVAILABLE YOUTUBE VIDEOS:
${videos.map((v, i) => `${i + 1}. ${v.title} - Video ID: ${v.id}`).join('\n')}` : ''}

Write the following sections according to the outline:

PART 1: REMAINING H2 SECTIONS (if sections 9-12 exist in outline)

For each remaining H2 section, follow the same structure:
- H2 heading (from outline)
- Opening paragraph (100-150 words)
- 4-5 H3 subsections (150-200 words each)
- Each H3 starts with a **bold summary sentence**
- Include specific examples, data, metrics
- Add comparison tables where indicated
- Use > blockquotes for pro tips

Target: 600-800 words per H2 section

PART 2: FAQ SECTION (target: 1,200-1,500 words)

## FAQ

Write 12-15 comprehensive questions and answers. Format:

**Q: How do [specific action] for [specific outcome]?**

[Opening answer sentence providing direct response]

[Second paragraph with more detail, specific examples, and data]

[Third paragraph with pro tip, best practice, or warning]

Target: 80-100 words per FAQ answer

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

PART 3: CONCLUSION (target: 400-500 words)

## Conclusion

Write a comprehensive conclusion with:

Paragraph 1 (100-120 words):
- Recap the main transformation or value proposition
- Emphasize the impact discussed in the article

Paragraph 2 (80-100 words):
- Key takeaways in bullet format:
  - Takeaway 1 with specific metric or insight
  - Takeaway 2 with actionable advice
  - Takeaway 3 with forward-looking perspective
  - Takeaway 4 with practical next step

Paragraph 3 (100-120 words):
- Discuss the future potential or next evolution
- Connect to broader trends

Paragraph 4 (80-100 words):
- Clear call-to-action
- Encouraging final statement
- Leave readers inspired and ready to act

FORMATTING REQUIREMENTS:
- Use **bold** for emphasis
- Keep paragraphs 3-4 sentences max
- Second-person tone ("you", "your")
- No section labels like "Title:", "Meta Description:", "Introduction:", "Section 1:" - start with ## headings or paragraph text directly
- Include specific data and examples in FAQ answers

CRITICAL REQUIREMENTS:
- Write ALL remaining H2 sections from the outline
- Write 12-15 FAQ questions (not just 5-7)
- Each FAQ answer must be 80-100 words (not just 2-3 sentences)
- Conclusion must be 400-500 words (not just 200-300)
- Do NOT include "SEO Suggestions" or "Image suggestions" sections
- Do NOT end with internal linking suggestions
- Do NOT include instruction markers like "# Remaining H2 Sections", "[Write...]", "[Add...]", etc.
- Do NOT include orphaned table headers without data rows
- Do NOT include TODO, NOTE, PLACEHOLDER, or similar meta-comments

WORD COUNT TARGET: 2,000-2,500 words for this phase minimum. Count carefully and ensure you meet this target.`;
}

