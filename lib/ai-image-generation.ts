/**
 * AI Image Generation Utility
 * Uses Replicate Flux Schnell to generate images based on text prompts
 */

import Replicate from 'replicate';

export type CandidateImage = {
  url?: string;
  data?: Buffer;
  contentType?: string;
};

interface GenerateImageOptions {
  prompt: string;
  n?: number;
  aspect_ratio?: string;
  output_format?: string;
  output_quality?: number;
}

const CANDIDATE_LIMIT = 5;

async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateAIImages(
  options: GenerateImageOptions
): Promise<CandidateImage[]> {
  const {
    prompt,
    n = 1,
    aspect_ratio = "16:9",
    output_format = "webp",
    output_quality = 80
  } = options;

  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('⚠️ REPLICATE_API_TOKEN not found, cannot generate AI images');
    return [];
  }

  try {
    console.log('🎨 Generating AI images with Flux Schnell, prompt:', prompt.substring(0, 120) + '...');

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    replicate.fetch = (url, options) => {
      return fetch(url, { cache: "no-store", ...options });
    };

    const model = "black-forest-labs/flux-schnell";
    const candidates: CandidateImage[] = [];

    for (let i = 0; i < Math.min(n, CANDIDATE_LIMIT); i++) {
      try {
        console.log(`🔄 Generating image ${i + 1}/${Math.min(n, CANDIDATE_LIMIT)}...`);
        const output = await replicate.run(model, {
          input: {
            prompt,
            aspect_ratio,
            output_format,
            output_quality,
          },
        });

        const outputs = Array.isArray(output) ? output : [output];

        for (const item of outputs) {
          if (typeof item === 'string' && item.startsWith('http')) {
            candidates.push({ url: item });
            console.log(`✅ Image ${i + 1} generated URL:`, item);
          } else if (item && typeof item === 'object' && 'getReader' in item) {
            const buffer = await streamToBuffer(item as ReadableStream);
            candidates.push({ data: buffer, contentType: 'image/webp' });
            console.log(`✅ Image ${i + 1} generated buffer (size=${buffer.length})`);
          } else if (item && typeof item === 'object' && 'arrayBuffer' in item) {
            const buffer = await streamToBuffer(item as unknown as ReadableStream);
            candidates.push({ data: buffer, contentType: 'image/webp' });
            console.log(`✅ Image ${i + 1} generated buffer from object`);
          } else {
            console.warn(`⚠️ Unexpected Flux Schnell output for prompt ${i + 1}:`, item);
          }
        }

        if (i < Math.min(n, CANDIDATE_LIMIT) - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`❌ Error generating image ${i + 1}:`, error?.message || error);
      }
    }

    if (candidates.length > 0) {
      console.log(`✅ Generated ${candidates.length} AI image candidate(s) with Flux Schnell`);
    } else {
      console.warn('⚠️ No images generated from Flux Schnell');
    }

    return candidates;
  } catch (error: any) {
    console.error('❌ Error generating AI images with Flux Schnell:', error?.message || error);
    return [];
  }
}

export function createImagePrompt(keyword: string): string {
  const cleanKeyword = keyword.trim();
  return `Professional, high-quality, modern illustration or photograph related to: ${cleanKeyword}.
    The image should be suitable for a blog article, clean and professional style, well-composed, good lighting, no text overlays or signage, and avoid any partial text strings. 
    Mention there should be no readable words — instead rely on abstract elements like icons, color blocks, or human scenes that visually represent the topic. 
    Ensure the image feels natural and not obviously AI-generated (no artifacts, no jagged letters).`;
}

export async function generateArticleImages(
  keyword: string,
  count: number = 3
): Promise<CandidateImage[]> {
  const basePrompt = createImagePrompt(keyword);
  const candidates: CandidateImage[] = [];
  const prompts = [
    basePrompt,
    `${basePrompt} Alternative perspective or angle.`,
    `${basePrompt} Different composition or style.`,
  ].slice(0, Math.min(count, 3));

  for (const prompt of prompts) {
    try {
      const results = await generateAIImages({
        prompt,
        n: 1,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 80,
      });

      if (results.length > 0) {
        candidates.push(...results);
      }

      if (prompts.indexOf(prompt) < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`❌ Error generating image for prompt "${prompt}":`, error);
    }
  }

  return candidates;
}

