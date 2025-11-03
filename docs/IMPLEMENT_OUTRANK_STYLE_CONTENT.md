# Implementation Guide: Outrank-Style Content Generation

## Quick Implementation Steps

### 1. Update Your AI Content Generation Prompt

**Location to Update:**
- `app/api/calendar/generate/route.ts` (around line 220-250)
- `app/api/ai/content-writer/route.ts` (content generation section)

### Current vs Enhanced Prompt Structure

#### Before (Basic):
```
Write a comprehensive blog post about ${keyword}
Include images throughout the article
Make it SEO-optimized and engaging
```

#### After (Outrank-Style):
```
Write a comprehensive, SEO-optimized blog post about: ${keyword}

PRIMARY KEYWORD: "${keyword}"
WORD COUNT: 2,500-3,500 words

STRUCTURE (CRITICAL):

1. COMPELLING TITLE
   - Include primary keyword naturally
   - Make it specific and benefit-driven
   - Example format: "How to [Action]: A [Adjective] Guide"

2. INTRODUCTION (250-300 words)
   - Start with a hook addressing the reader's pain point
   - Explain WHY this topic matters strategically
   - Include primary keyword in first 100 words
   - Preview what they'll learn
   - Keep paragraphs to 2-3 sentences max

3. MAIN BODY - Create 5-7 H2 SECTIONS
   
   For EACH H2 section, follow this pattern:
   
   ## H2: [Use Secondary Keyword Variation]
   
   Opening paragraph (150-200 words):
   - Explain the concept clearly
   - Why it matters
   - What the reader will learn in this section
   
   ### H3: First Subsection [Specific Technique]
   - Step-by-step explanation
   - Include specific example with real numbers
   - Tool names, metrics, actual data
   
   ### H3: Second Subsection [Related Technique]
   - Build on previous subsection
   - More detailed guidance
   - Pro tip or best practice
   
   ### H3: Third Subsection [Advanced/Alternative]
   - Expand the topic further
   - Include comparison or before/after
   - Add [Table] or [Image] placeholder if helpful
   
   [Smooth transition paragraph to next H2]

4. COMPARISON TABLES
   - Add 2-3 tables comparing tools, approaches, or timeframes
   - Use markdown table format
   - Include specific metrics and data

5. FAQ SECTION
   - Create 5-7 common questions
   - Use natural language: "Why do...", "How often...", "Is it better to..."
   - Answer each in 2-3 sentences, then expand with context
   - Include keywords naturally in questions

6. CONCLUSION (200 words)
   - Recap 3-4 key takeaways with bullet points
   - Provide ONE clear next action
   - End with encouraging statement

WRITING STYLE REQUIREMENTS:
- Use "you" and "your" throughout (second person)
- Conversational but authoritative tone
- Use contractions (you're, it's, don't)
- Short paragraphs (3-4 sentences maximum)
- Active voice, not passive
- Address pain points directly
- Avoid corporate jargon
- Use rhetorical questions occasionally

DATA & EXAMPLES (MUST INCLUDE):
- At least 7 specific examples with real numbers
- Real tool names (Google Keyword Planner, Ahrefs, Semrush, etc.)
- Specific metrics: "5,000 searches/month", "3% CTR", "2.5x increase"
- Before/after scenarios showing real outcomes
- Industry-specific use cases for context

KEYWORD INTEGRATION:
- Primary keyword: Naturally in title, first paragraph, one H2, conclusion
- Variations: Use semantic variations in H2/H3 headings
- LSI keywords: Naturally sprinkle related terms throughout
- Avoid exact-match repetition (sounds robotic)

INTERNAL LINKING OPPORTUNITIES:
- Reference related topics naturally
- Use descriptive anchor text like "our guide on [topic]"
- Suggest 3-5 related topics that would make good internal links

FORMATTING:
- Use **bold** for key terms on first mention
- Use bullet points for any list with 3+ items
- Use > blockquotes for pro tips or key insights
- Add placeholder notes like:
  [Table: Comparison of Free vs Paid SEO Tools]
  [Image: Screenshot showing keyword volume interface]

EMBED YOUTUBE VIDEOS:
For relevant sections, add video embeds using this exact format:
<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

IMPORTANT:
- Every H2 must have at least 2 H3 subsections
- Include at least one comparison table
- Add pro tips as blockquotes (>)
- Use real data and specific examples
- Make it scannable with clear structure
```

---

## 2. Enhanced Content Writer Prompt (Full Example)

Here's a complete implementation for your content writer API:

```typescript
// app/api/ai/content-writer/route.ts

const enhancedSystemPrompt = `You are an expert SEO content writer who creates comprehensive, engaging articles that rank well in search engines.

Your articles follow this proven structure:

1. **Engaging Title**: Include the main keyword naturally, make it benefit-driven
2. **Hook Introduction**: Start with a pain point or surprising fact
3. **Hierarchical Content**: H2 sections with 2-3 H3 subsections each
4. **Data-Driven Examples**: Include specific numbers, tool names, real scenarios
5. **Visual Content Markers**: Add [Table] and [Image] placeholders
6. **Pro Tips**: Use blockquotes (>) for insider advice
7. **FAQ Section**: Answer 5-7 common questions directly
8. **Actionable Conclusion**: Clear next steps

Writing style:
- Conversational and authoritative
- Second person ("you", "your")
- Short paragraphs (3-4 sentences)
- Active voice
- Include contractions
- Address reader pain points directly

CRITICAL: Every H2 section MUST contain 2-3 H3 subsections that dive deeper into specific techniques, tools, or strategies.`;

const userPrompt = `Write a comprehensive SEO-optimized article about: "${topic}"

Primary keyword: "${keyword}"
Target audience: ${targetAudience}
Tone: ${tone}

Follow the complete structure described in your system prompt. Make it 2,500-3,500 words.

Include:
- 5-7 H2 sections, each with 2-3 H3 subsections
- Specific examples with real numbers
- At least 2 comparison tables
- 5-7 FAQ questions and answers
- Pro tips as blockquotes
- Placeholders for images/tables
- Suggested internal linking opportunities

Embed relevant YouTube videos using iframe format where appropriate.

Make every section actionable and data-driven.`;
```

---

## 3. Add Subsection Logic to Existing Generation

### Update Calendar Generate Route

Location: `app/api/calendar/generate/route.ts` (around line 220-250)

**Find the section that constructs the content generation prompt and replace with:**

```typescript
const systemPrompt = `You are an expert SEO content writer. Create comprehensive, well-structured articles with clear hierarchies.

MANDATORY STRUCTURE:
- H1: Main title
- 5-7 H2 sections (major topics)
- Each H2 must have 2-3 H3 subsections (specific techniques/tools/strategies)
- FAQ section with 5-7 questions
- Conclusion with actionable next steps

Use conversational tone, specific examples with data, and pro tips in blockquotes (>).`;

const contentPrompt = `Write a 2,500+ word SEO-optimized article about: "${keywordText}"

Related keywords to incorporate naturally: ${relatedKeywords.join(', ')}

STRUCTURE REQUIREMENTS:

**Title**: Include "${keywordText}" naturally

**Introduction** (250 words):
- Hook with pain point
- Why this matters
- What they'll learn

**Main Body** - Create 5-7 H2 sections, each must include:

## H2: [Secondary Keyword Variation]
Opening paragraph explaining the concept

### H3: Specific Technique or Tool
Detailed explanation with example

### H3: Related Approach  
Build on previous subsection

### H3: Advanced Strategy
Further depth with data

**Include Throughout:**
- Specific numbers and metrics
- Real tool names
- Before/after examples
- Pro tips as blockquotes (>)
- [Table] placeholders for comparisons
- Internal link suggestions

**FAQ Section**: 5-7 questions starting with How, Why, What, When

**Conclusion**: Recap key points, clear next action

CRITICAL: Use H3 subsections extensively to break down each H2 into actionable steps.

${imageUrls.length > 0 ? `
EMBED THESE IMAGES:
${imageUrls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

Place images after relevant H2 sections using markdown: ![descriptive alt text](${url})
` : ''}

Make it comprehensive, data-driven, and highly actionable.`;
```

---

## 4. Post-Processing: Add Table of Contents

After content is generated, add a table of contents with jump links:

```typescript
// lib/add-table-of-contents.ts

export function addTableOfContents(content: string): string {
  // Extract all H2 and H3 headings
  const headingRegex = /^(##|###)\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1] === '##' ? 2 : 3;
    const text = match[1].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    headings.push({ level, text, id });
  }
  
  // Generate TOC markdown
  let toc = '\n## Table of Contents\n\n';
  headings.forEach(h => {
    const indent = h.level === 3 ? '  ' : '';
    toc += `${indent}* [${h.text}](#${h.id})\n`;
  });
  toc += '\n';
  
  // Insert TOC after introduction (first H2)
  const firstH2 = content.indexOf('\n## ');
  if (firstH2 !== -1) {
    return content.slice(0, firstH2) + toc + content.slice(firstH2);
  }
  
  return content;
}

// Usage in calendar/generate route:
// fullContent = addTableOfContents(fullContent);
```

---

## 5. Visual Content Placeholders

Add a function to insert image/table markers:

```typescript
// lib/process-content-placeholders.ts

export function processContentPlaceholders(
  content: string, 
  imageUrls: string[]
): string {
  let processed = content;
  let imageIndex = 0;
  
  // Replace [Image] placeholders with actual images
  processed = processed.replace(/\[Image:([^\]]+)\]/g, (match, description) => {
    if (imageIndex < imageUrls.length) {
      const url = imageUrls[imageIndex++];
      return `\n\n![${description}](${url})\n\n`;
    }
    return '';
  });
  
  // Format [Table] placeholders for visual distinction
  processed = processed.replace(/\[Table:([^\]]+)\]/g, 
    '> 📊 **Table**: $1\n> _(Table content to be added)_\n\n'
  );
  
  return processed;
}
```

---

## 6. Testing Your Implementation

### Checklist for Generated Content:

- [ ] Title includes primary keyword naturally
- [ ] Introduction hooks reader in first paragraph
- [ ] 5-7 H2 sections present
- [ ] Each H2 has at least 2 H3 subsections
- [ ] H3s are specific and actionable
- [ ] At least 5 specific examples with real data
- [ ] At least 1 comparison table
- [ ] Pro tips in blockquotes (>)
- [ ] FAQ section with 5-7 questions
- [ ] Internal linking opportunities mentioned
- [ ] Conversational "you" tone throughout
- [ ] Short paragraphs (3-4 sentences)
- [ ] Word count: 2,500-3,500 words
- [ ] Images embedded with proper markdown
- [ ] No keyword stuffing (natural variations)

### Test Generation Command:

```bash
# Generate a test article with enhanced structure
POST /api/calendar/generate
{
  "keyword": "how to improve website seo",
  "content_type": "blog post",
  "tone": "professional"
}
```

Check the output for:
1. Clear H2/H3 hierarchy
2. Subsections that dive deep
3. Specific examples and data
4. Natural keyword integration

---

## 7. Quick Wins Without Changing Code

### Content Editor Checklist

When reviewing AI-generated content before publishing:

1. **Add H3 Subsections**: If missing, break each H2 into 2-3 H3s
2. **Insert Real Numbers**: Replace vague terms with specific data
3. **Add Pro Tips**: Create 2-3 blockquote callouts
4. **Create Comparison Table**: Add at least one table
5. **Enhance Examples**: Make them more specific and realistic
6. **Add FAQ**: If missing, create 5 common questions
7. **Internal Links**: Add 3-5 contextual links
8. **Shorten Paragraphs**: Break any paragraph longer than 4 sentences

---

## Summary

To match Outrank's content quality:

✅ **Enhanced prompts** with clear structure requirements
✅ **H2/H3 hierarchy** with 2-3 subsections each
✅ **Data-driven examples** with specific numbers
✅ **Comparison tables** for easy scanning
✅ **FAQ sections** for featured snippets
✅ **Pro tips** in callout format
✅ **Internal linking** strategy
✅ **Conversational tone** with second person
✅ **Table of contents** with jump links

Implement these changes and your content will rival (or exceed) Outrank's SEO performance!

