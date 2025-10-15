import { MCPClient } from "@mastra/mcp";
import dotenv from 'dotenv';
// Load env from project root .env (avoid hardcoded paths)
dotenv.config();

// Singleton MCP Client instance
let mcpClientInstance: MCPClient | null = null;

// Singleton factory function
export function getMCPClient(): MCPClient {
    if (!mcpClientInstance) {
        mcpClientInstance = new MCPClient({
            timeout: 30000,
            servers: {
                dataForSEO: {
                    command: "npx",
                    args: [
                        "-y",
                        "@smithery/cli@latest",
                        "run",
                        "@moaiandin/mcp-dataforseo",
                        "--key",
                        process.env.DATA_FOR_SEO_KEY!,
                        "--profile",
                        "characteristic-walrus-1kqMhO"
                    ],
                    env: {
                        // Smithery cloud API key for remote MCP
                        SMITHERY_API_KEY: process.env.SMITHERY_API_KEY ?? ''
                    }
                },
                // Commented out firecrawlMCP - uncomment if needed
                firecrawlMCP: {
                    command: "npx",
                    args: [
                        "-y",
                        "firecrawl-mcp"
                    ],
                    env: {
                        FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!
                    }
                }
            }
        });
    }
    return mcpClientInstance;
}

// Cache for filtered tools to avoid re-fetching
const toolCache = new Map<string, any>();

// Option 2: Tool-level filtering functions
export async function getFilteredTools(options: {
    allowedTools?: string[];      // Whitelist specific tools
    blockedTools?: string[];      // Blacklist specific tools  
    serverFilter?: string[];      // Only get tools from specific servers
    startsWith?: string[];        // Only get tools that start with a specific string
}) {
    // Create cache key from options
    const cacheKey = JSON.stringify(options);
    
    // Check cache first
    if (toolCache.has(cacheKey)) {
        return toolCache.get(cacheKey);
    }

    // Determine if any MCP servers/tools are needed
    const wantsDataForSEO = options.allowedTools?.some(t => t.startsWith('dataForSEO_'))
      || options.serverFilter?.includes('dataForSEO')
      || options.startsWith?.some(p => p.startsWith('dataForSEO'));
    const hasSmitheryAuth = Boolean(process.env.SMITHERY_API_KEY);
    if (wantsDataForSEO) {
        if (!process.env.DATA_FOR_SEO_KEY) {
            console.warn('[MCP] DATA_FOR_SEO_KEY missing. Skipping DataForSEO tool discovery.');
            return {};
        }
        if (!hasSmitheryAuth) {
            console.warn('[MCP] SMITHERY_API_KEY missing. Skipping DataForSEO tool discovery to avoid 401.');
            return {};
        }
    }
    const wantsFirecrawl = options.allowedTools?.some(t => t.startsWith('firecrawlMCP_'))
      || options.serverFilter?.includes('firecrawlMCP')
      || options.startsWith?.some(p => p.startsWith('firecrawlMCP'));
    if (wantsFirecrawl && !process.env.FIRECRAWL_API_KEY) {
        console.warn('[MCP] FIRECRAWL_API_KEY missing. Skipping Firecrawl tool discovery.');
        return {};
    }

    // If no MCP servers/tools are requested, avoid constructing the MCP client
    const wantsAnyMCP = wantsDataForSEO || wantsFirecrawl;
    if (!wantsAnyMCP) {
        return {};
    }

    // Use singleton MCP client (with graceful failure)
    let allTools: Record<string, any> = {};
    try {
        const mcpClient = getMCPClient();
        allTools = await mcpClient.getTools();
    } catch (err) {
        console.error('[MCP] Failed to fetch tools. Proceeding without MCP tools.', err);
        return {};
    }
    let filteredTools: any = {};

    for (const [toolName, toolDef] of Object.entries(allTools)) {
        // Server filtering
        if (options.serverFilter) {
            const toolServer = (toolDef as any).server;
            if (toolServer && !options.serverFilter.includes(toolServer)) {
                continue;
            }
        }

        // Whitelist filtering  
        if (options.allowedTools && !options.allowedTools.includes(toolName)) {
            continue;
        }

        // Blacklist filtering
        if (options.blockedTools && options.blockedTools.includes(toolName)) {
            continue;
        }

        // StartsWith filtering
        if (options.startsWith && !options.startsWith.some(prefix => toolName.startsWith(prefix))) {
            continue;
        }

        filteredTools[toolName] = toolDef;
    }

    // Cache the result
    toolCache.set(cacheKey, filteredTools);
    
    return filteredTools;
}