import { mastra } from '@/lib/mastra';
import { NextRequest, NextResponse } from 'next/server';
import { imageSearch } from '../../../../src/mastra/tools/search';

// Function to extract image URLs from the response text
function extractImageUrls(text: string): string[] {
  const urls: string[] = [];
  
  // Multiple regex patterns to catch different image URL formats
  const patterns = [
    // Standard image URLs with extensions
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)(\?[^\s]*)?/gi,
    // URLs that might be images (no extension but common image hosting patterns)
    /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:imgur|flickr|unsplash|pexels|pixabay|shutterstock|gettyimages|istockphoto|depositphotos|dreamstime|stockphoto|123rf|canva|behance|dribbble)\.com\/[^\s]+/gi,
    // CDN URLs that are likely images
    /https?:\/\/[^\s]*\.(?:amazonaws|cloudfront|cloudinary|imgix|imagekit)\.io\/[^\s]+/gi,
    // URLs in markdown image format ![alt](url)
    /!\[[^\]]*\]\((https?:\/\/[^\s]+)\)/gi,
    // URLs in HTML img src format
    /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        // Extract URL from markdown or HTML format if needed
        let url = match;
        if (match.includes('](')) {
          url = match.split('](')[1].replace(')', '');
        } else if (match.includes('src="')) {
          url = match.split('src="')[1].split('"')[0];
        }
        
        if (url && url.startsWith('http')) {
          urls.push(url);
        }
      }
    }
  }
  
  // Remove duplicates and filter out common non-image URLs
  const uniqueUrls = [...new Set(urls)].filter(url => 
    !url.includes('logo') && 
    !url.includes('icon') && 
    !url.includes('avatar') &&
    !url.includes('favicon') &&
    !url.includes('profile') &&
    url.length > 30 // Filter out very short URLs
  );
  
  return uniqueUrls;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: { role: 'user' | 'assistant' | 'system'; content: string }[] };
    console.log('🖼️ Received image search request:', { messageCount: messages.length, lastMessage: messages[messages.length - 1]?.content });
    
    const agent = mastra.getAgent('imageSearchAgent');
    if (!agent) {
      console.error('❌ imageSearchAgent not found in mastra instance');
      return NextResponse.json({ error: 'imageSearchAgent not found' }, { status: 500 });
    }

    console.log('✅ Found imageSearchAgent, starting stream...');
    
    // Extract the search query from the user's message
    const userMessage = messages[messages.length - 1]?.content || '';
    const searchQuery = userMessage.replace(/search for images of|find images of|images of/gi, '').trim();
    
    // Get images directly from the search tool (request up to the user's desired count if present)
    let imageUrls: string[] = [];
    try {
      // Try to infer a desired count from the message
      const countMatch = userMessage.match(/(\d+)\s*(images|image)/i);
      const desiredCount = countMatch ? Math.min(12, Math.max(1, parseInt(countMatch[1], 10))) : 6;
      imageUrls = await imageSearch(searchQuery || userMessage, desiredCount);
      console.log('🖼️ Direct search found images:', imageUrls);
    } catch (error) {
      console.error('❌ Direct image search failed:', error);
    }
    
    const stream = await agent.streamVNext(messages.map(msg => msg.content));

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        let tokenCount = 0;
        let fullResponse = '';
        let allImages = new Set(imageUrls); // Use Set to automatically deduplicate
        
        try {
          // Send initial images if we found any
          if (imageUrls.length > 0) {
            const imagesData = `data: ${JSON.stringify({ type: 'images', urls: imageUrls })}\n\n`;
            controller.enqueue(encoder.encode(imagesData));
          }
          
          // Stream the text response and collect additional images
          for await (const chunk of stream.textStream) {
            tokenCount++;
            fullResponse += chunk;
            
            // Extract images from the streaming response
            const newImages = extractImageUrls(chunk);
            if (newImages.length > 0) {
              // Add new images to our set (automatically deduplicates)
              newImages.forEach(url => allImages.add(url));
              
              // Send updated image list if we found new ones
              const updatedImages = Array.from(allImages);
              const newImagesData = `data: ${JSON.stringify({ type: 'images', urls: updatedImages })}\n\n`;
              controller.enqueue(encoder.encode(newImagesData));
            }
            
            const data = `data: ${JSON.stringify({ type: 'token', value: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // Final check for any images in the complete response
          const finalImages = extractImageUrls(fullResponse);
          if (finalImages.length > 0) {
            finalImages.forEach(url => allImages.add(url));
            const finalImagesData = `data: ${JSON.stringify({ type: 'images', urls: Array.from(allImages) })}\n\n`;
            controller.enqueue(encoder.encode(finalImagesData));
          }
          
          console.log(`✅ Image search stream completed, sent ${tokenCount} tokens, found ${allImages.size} total images`);
          
          const doneData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(doneData));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          console.error('❌ Image search error:', message, err);
          const errorData = `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Image search error:', message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
