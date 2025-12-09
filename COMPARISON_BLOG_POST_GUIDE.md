# How to Create Comparison Blog Posts in WordPress

This guide shows you how to use the Content Writer tool to generate comparison blog posts (like "Bridgely vs SurferSEO") and publish them directly to WordPress.

## Step-by-Step Process

### 1. Navigate to Content Writer
Go to `/content-writer` in your app.

### 2. Fill Out the Form

**Topic:** 
Enter your comparison title format:
```
[Tool A] vs [Tool B] — Which Is Better for [Use Case]?
```

Example:
```
Bridgely vs SurferSEO — Which Is Better for AI SEO Blogging?
```

**Content Type:** 
Select `blog-post`

**Target Audience:**
Be specific about who would read this comparison:
```
SEO professionals, content marketers, bloggers looking for AI SEO tools
```

**Tone:**
Choose based on your audience:
- `professional` - For B2B audiences
- `authoritative` - For expert audiences  
- `conversational` - For general audiences
- `informative` - For educational content

**Length:**
For comparison posts, choose:
- `long` (1500-2500 words) - Comprehensive comparisons
- `comprehensive` (2500+ words) - Very detailed comparisons

**Additional Context (CRITICAL):**
This is where you provide the detailed instructions for comparison posts. Use this template:

```
Create a detailed comparison blog post between [Tool A] and [Tool B] for [use case].

Structure Requirements:
1. Start with an engaging introduction explaining why choosing the right tool matters
2. Include a "Quick Verdict" section with a clear winner recommendation
3. Create a detailed feature comparison table with columns: Feature | [Tool A] | [Tool B]
4. Break down comparisons by category:
   - AI Writing Quality
   - SEO Optimization & Ranking Ability
   - Ease of Use
   - Pricing Comparison
   - Best Use Cases
5. Include a "Final Verdict" section summarizing the winner and why
6. Use checkmarks (✔) and X marks (❌) in the comparison table
7. Include star ratings (⭐⭐⭐⭐⭐) where appropriate
8. Make it SEO-optimized with proper H2/H3 headings
9. Include internal linking opportunities
10. End with a call-to-action

Comparison Points to Cover:
- Feature comparison (use markdown table format)
- Pricing differences
- Ease of use
- Target audience for each tool
- Pros and cons
- Real-world use cases
- Which tool wins for specific scenarios

Tone: [professional/authoritative/conversational]
Bias: [if any - e.g., "Bridgely is our product, but be fair"]
```

### 3. Example Full Prompt

Here's a complete example for the Bridgely vs SurferSEO post:

**Topic:**
```
Bridgely vs SurferSEO — Which Is Better for AI SEO Blogging?
```

**Target Audience:**
```
Solo founders, bloggers, content marketers, and SEO professionals looking for AI SEO tools
```

**Tone:**
```
professional
```

**Length:**
```
long
```

**Additional Context:**
```
Create a detailed comparison blog post between Bridgely and SurferSEO for AI SEO blogging.

Structure Requirements:
1. Start with an engaging introduction explaining why choosing the right AI SEO tool matters
2. Include a "Quick Verdict" section recommending Bridgely as best for automated AI SEO blogging
3. Create a detailed feature comparison table with columns: Feature | Bridgely | SurferSEO
4. Break down comparisons by category:
   - AI Writing Quality
   - SEO Optimization & Ranking Ability  
   - Ease of Use
   - Pricing Comparison
   - Best Use Cases
5. Include a "Final Verdict" section summarizing why Bridgely wins for automated content
6. Use checkmarks (✔) and X marks (❌) in the comparison table
7. Include star ratings (⭐⭐⭐⭐⭐) where appropriate
8. Make it SEO-optimized with proper H2/H3 headings
9. Include internal linking opportunities
10. End with a call-to-action suggesting other comparison articles

Comparison Points to Cover:
- Feature comparison (use markdown table format: | Feature | Bridgely | SurferSEO |)
- Pricing differences (Bridgely is more affordable)
- Ease of use (Bridgely is simpler, SurferSEO requires manual work)
- Target audience (Bridgely for solo creators, SurferSEO for teams)
- Pros and cons of each
- Real-world use cases
- Which tool wins for automated SEO blogging vs manual optimization

Tone: professional but accessible
Bias: Bridgely is our product, but be fair and acknowledge SurferSEO's strengths for manual optimization teams
```

### 4. Generate the Content

Click "Generate Content" and wait for the AI to create your comparison post. The tool will:
- Generate SEO-optimized content
- Create markdown tables (automatically converted to HTML for WordPress)
- Structure with proper headings
- Include comparison sections
- Add internal linking suggestions

### 5. Review and Edit

After generation, review the content:
- Check that tables are properly formatted
- Verify comparison points are balanced
- Ensure the verdict aligns with your goals
- Add any missing features or points

### 6. Publish to WordPress

Once satisfied:
1. Click the **"Publish to WordPress"** button (green button with upload icon)
2. Select your WordPress site
3. Choose publishing options:
   - **Status:** Publish immediately or save as draft
   - **Categories:** Add relevant categories
   - **Tags:** Add SEO tags
   - **Featured Image:** Upload if needed
   - **Schedule:** Set future publish date if needed
4. Click **"Publish"**

The content will be automatically formatted for WordPress:
- Tables converted to HTML with proper styling
- Headings formatted correctly
- Images embedded
- Meta descriptions added

## Table Formatting Tips

The content writer uses markdown tables that automatically convert to WordPress HTML tables:

```markdown
| Feature | Bridgely | SurferSEO |
|---------|----------|-----------|
| AI Blog Writing | ✔ Full long-form generation | ❌ No full writing |
| SEO Content Score | ✔ Built-in optimization | ✔ Strong scoring system |
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
```

This will render as a beautiful HTML table in WordPress with:
- Proper spacing
- Responsive design
- Styled borders
- Gradient backgrounds (if theme supports)

## Best Practices

1. **Be Fair:** Even if comparing your own product, acknowledge competitor strengths
2. **Be Specific:** Use concrete examples and feature lists
3. **Use Tables:** Comparison tables make it easy to scan differences
4. **Include Verdicts:** Readers want clear recommendations
5. **SEO Optimize:** Use target keywords naturally throughout
6. **Add CTAs:** End with clear next steps for readers

## Other Comparison Ideas

You can generate similar comparisons for:
- `Bridgely vs Rankpill`
- `Bridgely vs Outrank`
- `Bridgely vs Jasper`
- `Bridgely vs Frase`
- `Best AI SEO Tools 2025 (Including Bridgely)`

Just change the topic and update the additional context accordingly!

## Troubleshooting

**Tables not rendering?**
- Ensure markdown table syntax is correct (pipes `|` between columns)
- Check that table has header row with separator row (`|---|---|`)

**Content too biased?**
- Adjust the "Bias" section in Additional Context
- Ask for "fair and balanced comparison"

**Missing features?**
- List specific features in Additional Context
- Request "comprehensive feature comparison"

**Word count too short/long?**
- Adjust the Length dropdown
- Specify word count in Additional Context

