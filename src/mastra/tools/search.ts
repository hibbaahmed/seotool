import { createTool } from "@mastra/core";
import { z } from "zod";

// Conditionally import Tavily only if API key is available
let tvly: any = null;

async function initializeTavily() {
  if (process.env.TAVILY_API_KEY && !tvly) {
    try {
      const { tavily } = await import("@tavily/core");
      tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    } catch (error) {
      console.warn("Tavily not available:", error);
    }
  }
}

const MAX_DEPTH = 5;

// Report and Citation Variables
let reportBuilder = "";
let reportWithCitationBuilder = "";
let citations = "";
let statsReport = "";
let relatedImages = "";
let imageCount = 0;

export async function imageSearch(query: string, maxCount: number = 6): Promise<string[]> {
  let images: string[] = [];

  // Initialize Tavily if not already done
  await initializeTavily();

  if (!tvly) {
    // Fallback to placeholder if Tavily is not available
    console.log("Tavily not available, using placeholder images");
    images.push(`https://via.placeholder.com/400x300?text=${encodeURIComponent(query)}`);
    return images;
  }

  try {
    // Generate multiple search variations to find more images
    const searchVariations = [
      query,
      `${query} images`,
      `${query} photos`,
      `${query} pictures`,
      `${query} graphics`,
      `stock photos ${query}`,
      `free images ${query}`,
      `${query} illustrations`,
    ];

    // Perform multiple searches to collect more images
    for (const searchQuery of searchVariations) {
      try {
        console.log(`Searching for: "${searchQuery}"`);
        const diagramres = await tvly.search(searchQuery, {
          searchDepth: "basic",
          includeImages: true,
          includeImageDescriptions: true,
        });

        // Collect as many image urls as available
        if (Array.isArray(diagramres.images)) {
          for (const img of diagramres.images) {
            const url = img?.url ?? img?.image_url ?? img?.source;
            if (typeof url === 'string' && url.startsWith('http')) {
              images.push(url);
            }
          }
        }

        // Stop if we have enough unique images
        const uniqueImages = Array.from(new Set(images));
        if (uniqueImages.length >= Math.min(20, Math.max(1, maxCount))) {
          break;
        }
      } catch (searchError) {
        console.warn(`Search failed for "${searchQuery}":`, searchError);
        // Continue with next search variation
      }
    }

    // Dedupe and cap to requested count
    images = Array.from(new Set(images)).slice(0, Math.min(20, Math.max(1, maxCount)));

    console.log("Found images:", images);
  } catch (error) {
    console.error("Tavily search error:", error);
    // Fallback to placeholder if Tavily fails
    images.push(`https://via.placeholder.com/400x300?text=${encodeURIComponent(query)}`);
  }

  return images;
}

export const searchImage = createTool({
    id: "search-image",
    description: "Search the web for images based on a query.",
    inputSchema: z.object({
      searchQuery: z.string().describe("The query to search for images."),
    }),
    outputSchema: z.object({
      images: z
        .array(z.string())
        .optional()
        .describe("The array of image URLs"),
    }),
    execute: async ({ context }) => {
      const images = await imageSearch(context.searchQuery);
      return { images };
    },
  });
