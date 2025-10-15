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

export async function imageSearch(query: string): Promise<string[]> {
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
    const diagramres = await tvly.search(query, {
      searchDepth: "basic",
      includeImages: true,
      includeImageDescriptions: true,
    });

    if (diagramres.images && diagramres.images.length > 0) {
      const diagram = diagramres.images[0];
      if (diagram.url) {
        images.push(diagram.url);
      }
    }

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
