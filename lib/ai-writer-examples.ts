/**
 * AI SEO Writer - Example API Integration
 * 
 * This file demonstrates how to integrate with the AI SEO Writer API
 * for content generation, editing, and publishing.
 */

// Example 1: Generate Content
export async function generateContentExample() {
  const contentRequest = {
    topic: "Ultimate Guide to SEO in 2024",
    keywords: ["SEO", "search engine optimization", "digital marketing", "content marketing"],
    language: "en",
    tone: "professional",
    length: "medium",
    includeImages: true,
    includeVideo: false,
    includeTableOfContents: true,
    targetAudience: "Digital marketers and SEO professionals"
  }

  try {
    const response = await fetch('/api/ai/generate-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contentRequest),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('Generated content:', data.content)
      console.log('Metrics:', data.metrics)
      return data
    } else {
      console.error('Error:', data.error)
      throw new Error(data.error)
    }
  } catch (error) {
    console.error('Failed to generate content:', error)
    throw error
  }
}

// Example 2: Publish Content to CMS
export async function publishContentExample(content: any) {
  const publishRequest = {
    title: content.title,
    content: content.content,
    type: 'BLOG',
    status: 'PUBLISHED',
    projectId: 'your-project-id',
    userId: 'current-user-id',
    keywords: content.keywords,
    metaTitle: content.title,
    metaDescription: content.content.substring(0, 160),
    seoScore: content.seoScore
  }

  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-jwt-token'
      },
      body: JSON.stringify(publishRequest),
    })

    const data = await response.json()

    if (response.ok) {
      console.log('Content published:', data.content)
      return data.content
    } else {
      console.error('Publish error:', data.error)
      throw new Error(data.error)
    }
  } catch (error) {
    console.error('Failed to publish content:', error)
    throw error
  }
}

// Example 3: Syndicate to Social Media
export async function syndicateToSocialExample(content: any) {
  const socialPosts = [
    {
      platform: 'TWITTER',
      content: `🚀 ${content.title}\n\n${content.content.substring(0, 200)}...\n\n#SEO #ContentMarketing`,
      scheduledAt: new Date(Date.now() + 60000) // 1 minute from now
    },
    {
      platform: 'LINKEDIN',
      content: `📝 ${content.title}\n\n${content.content.substring(0, 300)}...\n\nRead the full article on our blog!`,
      scheduledAt: new Date(Date.now() + 300000) // 5 minutes from now
    },
    {
      platform: 'FACEBOOK',
      content: `🎯 ${content.title}\n\n${content.content.substring(0, 400)}...\n\nCheck out our latest insights!`,
      scheduledAt: new Date(Date.now() + 600000) // 10 minutes from now
    }
  ]

  try {
    // Simulate API calls for each platform
    for (const post of socialPosts) {
      console.log(`Scheduling post for ${post.platform}:`, post.content)
      
      // In a real implementation, you would call the respective social media APIs
      // await twitterAPI.schedulePost(post)
      // await linkedinAPI.schedulePost(post)
      // await facebookAPI.schedulePost(post)
    }

    console.log('Content syndicated to social media platforms!')
    return socialPosts
  } catch (error) {
    console.error('Failed to syndicate content:', error)
    throw error
  }
}

// Example 4: Complete Workflow
export async function completeContentWorkflow() {
  try {
    // Step 1: Generate content
    console.log('Step 1: Generating content...')
    const generatedContent = await generateContentExample()
    
    // Step 2: Parse and structure content
    console.log('Step 2: Parsing content...')
    const structuredContent = parseGeneratedContent(generatedContent.content)
    
    // Step 3: Publish to CMS
    console.log('Step 3: Publishing to CMS...')
    const publishedContent = await publishContentExample(structuredContent)
    
    // Step 4: Syndicate to social media
    console.log('Step 4: Syndicating to social media...')
    const socialPosts = await syndicateToSocialExample(structuredContent)
    
    console.log('Content workflow completed successfully!')
    return {
      generated: generatedContent,
      published: publishedContent,
      socialPosts: socialPosts
    }
  } catch (error) {
    console.error('Content workflow failed:', error)
    throw error
  }
}

// Helper function to parse generated content
function parseGeneratedContent(content: string) {
  // Extract title (first H1)
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'

  // Extract table of contents
  const tocMatch = content.match(/## Table of Contents\n([\s\S]*?)(?=\n##|\n#|$)/)
  const toc = tocMatch ? 
    tocMatch[1].split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line) : []

  // Extract images (placeholder format: [IMAGE: description])
  const imageMatches = [...content.matchAll(/\[IMAGE:\s*([^\]]+)\]/g)]
  const images = imageMatches.map((match, index) => ({
    placeholder: match[0],
    description: match[1],
    position: content.indexOf(match[0])
  }))

  // Extract videos (placeholder format: [VIDEO: description])
  const videoMatches = [...content.matchAll(/\[VIDEO:\s*([^\]]+)\]/g)]
  const videos = videoMatches.map((match, index) => ({
    placeholder: match[0],
    description: match[1],
    position: content.indexOf(match[0])
  }))

  // Extract links (markdown format: [text](url))
  const linkMatches = [...content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
  const links = linkMatches.map((match, index) => ({
    text: match[1],
    url: match[2],
    position: content.indexOf(match[0])
  }))

  const wordCount = content.split(' ').length
  const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

  return {
    title,
    content,
    tableOfContents: toc,
    images,
    videos,
    links,
    wordCount,
    readingTime,
    seoScore: calculateSEOScore(content)
  }
}

// Helper function to calculate SEO score
function calculateSEOScore(content: string): number {
  let score = 100
  
  // Check heading structure
  const h1Count = (content.match(/^#\s/gm) || []).length
  if (h1Count === 0) score -= 20
  if (h1Count > 1) score -= 10

  // Check content length
  const wordCount = content.split(' ').length
  if (wordCount < 300) score -= 15
  if (wordCount > 2000) score -= 5

  // Check for images
  const imageCount = (content.match(/\[IMAGE:/g) || []).length
  if (imageCount === 0) score -= 10
  if (imageCount >= 3) score += 5

  // Check for links
  const linkCount = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length
  if (linkCount === 0) score -= 5
  if (linkCount >= 3) score += 5

  return Math.max(0, score)
}

// Example usage in a React component
export const AIWriterIntegrationExample = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    try {
      const content = await generateContentExample()
      setGeneratedContent(content)
    } catch (error) {
      console.error('Failed to generate content:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI SEO Writer Integration</h1>
      
      <button
        onClick={handleGenerateContent}
        disabled={isGenerating}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Content'}
      </button>

      {generatedContent && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Generated Content</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {generatedContent.content}
          </pre>
        </div>
      )}
    </div>
  )
}


