import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Support for multiple AI providers
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai' // 'openai' or 'claude'

// Duplicate schema removed below; keeping single source of truth defined at top of file

// OpenAI integration
async function generateWithOpenAI(prompt: string) {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert SEO content writer who creates high-quality, engaging, and SEO-optimized articles. Always structure content with proper headings, include actionable insights, and ensure the content is valuable to readers."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 4000,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content
}

// Claude integration
async function generateWithClaude(prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: "You are an expert SEO content writer who creates high-quality, engaging, and SEO-optimized articles. Always structure content with proper headings, include actionable insights, and ensure the content is valuable to readers.",
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text
}

const generateContentSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  keywords: z.array(z.string()).default([]),
  language: z.string().default('en'),
  tone: z.enum(['professional', 'casual', 'technical', 'creative']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  includeImages: z.boolean().default(false),
  includeVideo: z.boolean().default(false),
  includeTableOfContents: z.boolean().default(true),
  targetAudience: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic,
      keywords,
      language,
      tone,
      length,
      includeImages,
      includeVideo,
      includeTableOfContents,
      targetAudience
    } = generateContentSchema.parse(body)

    // Determine word count based on length
    const wordCounts = {
      short: '500-800',
      medium: '800-1500',
      long: '1500+'
    }

    // Build the prompt
    let prompt = `Write a comprehensive ${tone} article about "${topic}" in ${language}. 
    
    Requirements:
    - Word count: ${wordCounts[length]} words
    - Tone: ${tone}
    - Language: ${language}
    ${targetAudience ? `- Target audience: ${targetAudience}` : ''}
    ${keywords.length > 0 ? `- Include these keywords naturally: ${keywords.join(', ')}` : ''}
    ${includeTableOfContents ? '- Include a table of contents section' : ''}
    ${includeImages ? '- Include image placeholders using format [IMAGE: description]' : ''}
    ${includeVideo ? '- Include video placeholders using format [VIDEO: description]' : ''}

    Structure the content with:
    1. Engaging introduction
    2. Well-organized sections with subheadings (use ## for main sections, ### for subsections)
    3. Practical examples and actionable insights
    4. Strong conclusion
    5. SEO-optimized formatting

    Format requirements:
    - Use markdown formatting
    - Start with # for the main title
    - Use ## for main sections
    - Use ### for subsections
    - Include bullet points and numbered lists where appropriate
    - Add relevant links using markdown format [text](url)
    ${includeTableOfContents ? '- Include "## Table of Contents" section with bullet points' : ''}
    ${includeImages ? '- Add [IMAGE: descriptive text] placeholders at relevant points' : ''}
    ${includeVideo ? '- Add [VIDEO: descriptive text] placeholders at relevant points' : ''}

    Make sure the content is:
    - Original and valuable
    - Well-structured with proper headings
    - SEO-friendly with natural keyword integration
    - Engaging for readers
    - Factually accurate (use general knowledge)
    - Includes actionable insights and practical examples`

    // Generate content using selected AI provider
    let generatedContent: string | null | undefined
    
    if (AI_PROVIDER === 'claude') {
      generatedContent = await generateWithClaude(prompt)
    } else {
      generatedContent = await generateWithOpenAI(prompt)
    }

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      )
    }

    // Calculate basic metrics
    const wordCount = generatedContent.split(' ').length
    const paragraphCount = generatedContent.split('\n\n').length
    const headingCount = (generatedContent.match(/^#+\s/gm) || []).length

    return NextResponse.json({
      message: 'Content generated successfully',
      content: generatedContent,
      provider: AI_PROVIDER,
      metrics: {
        wordCount,
        paragraphCount,
        headingCount,
        keywordCount: keywords.length,
        language,
        tone,
        length
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
