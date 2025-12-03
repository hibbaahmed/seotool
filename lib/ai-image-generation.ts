/**
 * AI Image Generation Utility
 * Uses Replicate Flux Pro/Dev for high-quality image generation based on text prompts
 */

import Replicate from 'replicate';

export type CandidateImage = {
  url?: string;
  data?: Buffer;
  contentType?: string;
};

interface GenerateImageOptions {
  prompt: string;
  negative_prompt?: string;
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
    negative_prompt = 'text, typography, words, letters, captions, signage, logos, trademarks, watermark, gibberish text, company names, blurry, low quality, pixelated, grainy',
    n = 1,
    aspect_ratio = "16:9",
    output_format = "webp",
    output_quality = 95
  } = options;

  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('⚠️ REPLICATE_API_TOKEN not found, cannot generate AI images');
    return [];
  }

  try {
    console.log('🎨 Generating high-quality AI images with Flux Pro/Dev, prompt:', prompt.substring(0, 120) + '...');

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    replicate.fetch = (url, options) => {
      return fetch(url, { cache: "no-store", ...options });
    };

    // Use flux-pro for higher quality images (slower but much better quality)
    // Fallback to flux-dev if flux-pro is not available
    const model = "black-forest-labs/flux-pro";
    const candidates: CandidateImage[] = [];

    for (let i = 0; i < Math.min(n, CANDIDATE_LIMIT); i++) {
      try {
        console.log(`🔄 Generating high-quality image ${i + 1}/${Math.min(n, CANDIDATE_LIMIT)}...`);
        
        // Enhanced prompt with quality descriptors
        const enhancedPrompt = `${prompt}, ultra high definition, 8k resolution, sharp focus, detailed, crisp, professional photography, masterpiece quality`;
        
        let output;
        try {
          // Try flux-pro first (highest quality)
          // Build input with supported parameters
          const inputParams: any = {
            prompt: enhancedPrompt,
            negative_prompt: `${negative_prompt}, blurry, low quality, pixelated, grainy, soft focus, out of focus, low resolution`,
            aspect_ratio: aspect_ratio || "16:9",
            output_format: output_format || 'png', // Use PNG for better quality
            output_quality: output_quality || 100, // Maximum quality
          };
          
          // Add advanced parameters if supported by the model
          // Note: These may not be supported by all Flux models
          inputParams.num_inference_steps = 28; // More steps = better quality
          inputParams.guidance_scale = 7.5; // Higher guidance for better prompt adherence
          
          output = await replicate.run(model, { input: inputParams });
        } catch (proError: any) {
          console.warn('⚠️ flux-pro failed, falling back to flux-dev:', proError?.message || proError);
          // Fallback to flux-dev if flux-pro fails
          const devInput: any = {
            prompt: enhancedPrompt,
            negative_prompt: `${negative_prompt}, blurry, low quality, pixelated, grainy, soft focus, out of focus, low resolution`,
            aspect_ratio: aspect_ratio || "16:9",
            output_format: output_format || 'png',
            output_quality: output_quality || 100,
          };
          
          // Try with advanced parameters, but they may not be supported
          try {
            devInput.num_inference_steps = 28;
            devInput.guidance_scale = 7.5;
          } catch (e) {
            // Ignore if not supported
          }
          
          output = await replicate.run("black-forest-labs/flux-dev", { input: devInput });
        }

        const outputs = Array.isArray(output) ? output : [output];

        for (const item of outputs) {
          if (typeof item === 'string' && item.startsWith('http')) {
            candidates.push({ url: item });
            console.log(`✅ Image ${i + 1} generated URL:`, item);
          } else if (item && typeof item === 'object' && 'getReader' in item) {
            const buffer = await streamToBuffer(item as ReadableStream);
            candidates.push({ data: buffer, contentType: output_format === 'png' ? 'image/png' : 'image/webp' });
            console.log(`✅ Image ${i + 1} generated buffer (size=${buffer.length})`);
          } else if (item && typeof item === 'object' && 'arrayBuffer' in item) {
            const buffer = await streamToBuffer(item as unknown as ReadableStream);
            candidates.push({ data: buffer, contentType: output_format === 'png' ? 'image/png' : 'image/webp' });
            console.log(`✅ Image ${i + 1} generated buffer from object`);
          } else {
            console.warn(`⚠️ Unexpected Flux output for prompt ${i + 1}:`, item);
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
      console.log(`✅ Generated ${candidates.length} high-quality AI image candidate(s) with Flux Pro/Dev`);
    } else {
      console.warn('⚠️ No images generated from Flux Pro/Dev');
    }

    return candidates;
  } catch (error: any) {
    console.error('❌ Error generating AI images with Flux Pro/Dev:', error?.message || error);
    return [];
  }
}

export function createImagePrompt(keyword: string): string {
  const cleanKeyword = keyword.trim();
  return `Professional, high-quality, ultra-sharp, crystal-clear, brand-safe illustration or cinematic photo that represents: ${cleanKeyword}.
  Show people, workplaces, dashboards, or abstract shapes that convey the concept through visuals only.
  Absolutely NO text, words, letters, numbers, logos, brand names (like Google), signage, or UI labels anywhere in the frame.
  If screens are shown, keep them blurred or filled with simple gradients or icon blocks without glyphs.
  Use clean lighting, modern color palettes, subtle gradients, sharp focus, ultra high definition, 8K resolution, detailed textures, crisp edges, professional photography quality, cinematic composition, depth of field, realistic shadows, and avoid obvious AI artifacts, blur, pixelation, or low quality.`;
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
        negative_prompt: 'text, typography, words, letters, captions, signage, brand names, company logos, gibberish fonts, user interface text, subtitles, watermark, blurry, low quality, pixelated, grainy, out of focus, soft focus, low resolution, distorted, artifacts',
        n: 1,
        aspect_ratio: '16:9',
        output_format: 'png', // Use PNG for better quality
        output_quality: 100, // Maximum quality
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

