import Replicate from "replicate";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    console.log("=== ENHANCED IMAGE GENERATION API CALLED ===");
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error("REPLICATE_API_TOKEN is not set");
      throw new Error("Replicate API token not configured");
    }
    
    const { prompt, style, imageFormat, motion = false, motionType = 'subtle', motionIntensity = 'medium' } = await req.json();
    console.log("Received request:", { 
      prompt: prompt?.substring(0, 50) + "...", 
      style, 
      imageFormat, 
      motion,
      motionType,
      motionIntensity
    });
    
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.error("Error setting cookies:", error.message);
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error("User not authenticated for image generation");
    }
    
    console.log("User authenticated:", user.id);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    // Enhanced dimensions for better quality
    let width = 1024;
    let height = 1280;
   
    if (imageFormat === "landscape") {
      width = 1920;
      height = 1080;
    } else if (imageFormat === "portrait") {
      width = 1024;
      height = 1280;
    } else if (imageFormat === "square") {
      width = 1024;
      height = 1024;
    } else if (imageFormat === "widescreen") {
      width = 1920;
      height = 1080;
    } else if (imageFormat === "vertical") {
      width = 1080;
      height = 1920;
    }
    
    console.log(`Image dimensions for ${imageFormat}: ${width}x${height}`);
    
    // Enhanced cinematic quality descriptors for photorealistic results
    const cinematicDescriptors = [
      "cinematic lighting",
      "ultra high definition",
      "sharp focus",
      "film still",
      "8k resolution",
      "dramatic lighting",
      "masterpiece",
      "trending on artstation",
      "photorealistic",
      "professional photography",
      "cinematic composition",
      "golden hour lighting",
      "atmospheric",
      "epic scale",
      "detailed textures",
      "realistic shadows",
      "depth of field",
      "cinematic color grading"
    ].join(", ");
    
    const enhancedPrompt = `${prompt}, ${cinematicDescriptors}`;
    
    console.log(`Generating ${motion ? "animated" : "static"} image with enhanced realism`);

    let output;

    if (motion) {
      // Generate motion video prediction
      const motionResult = await generateAnimatedImage(replicate, enhancedPrompt, style, width, height, motionType, motionIntensity);
      
      // Return the prediction info for the video creation process to handle
      output = motionResult;
    } else {
      output = await generateStaticImage(replicate, enhancedPrompt, style, width, height);
    }

    console.log("Returning enhanced result:", output);
    return NextResponse.json({ result: output });

  } catch (e) {
    console.error("=== ENHANCED IMAGE GENERATION ERROR ===");
    console.error("Error message:", e.message);
    
    return NextResponse.json({ 
      error: e.message || "An error occurred during image generation"
    }, { status: 500 });
  }
}

async function generateStaticImage(replicate, enhancedPrompt, style, width, height) {
  console.log(`generateStaticImage called with enhanced style: ${style}`);
  
  let output;
  
  try {
    if (style === "Studio Ghibli") {
      console.log("Using enhanced Studio Ghibli model...");
      const ghibliInput = {
        prompt: enhancedPrompt,
        width: width,
        height: height,
        scheduler: "K_EULER_ANCESTRAL",
        num_inference_steps: 40, // Increased for better quality
        guidance_scale: 8.5, // Increased for better adherence to prompt
        num_outputs: 1
      };
     
      output = await replicate.run(
        "karanchawla/studio-ghibli:fd1975a55465d2cf70e5e9aad03e0bb2b13b9f9b715d49a27748fc45797a6ae5",
        { input: ghibliInput }
      );
    } else {
      // Use Flux.1-dev as the primary model for all other styles
      console.log("Using Flux.1-dev model for enhanced photorealistic results...");
      
      // Flux.1-dev supports different aspect ratios, so use the actual dimensions
      const fluxInput = {
        prompt: enhancedPrompt,
        width: width,
        height: height,
        num_outputs: 1,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        negative_prompt: "blurry, low quality, distorted, unrealistic, cartoon, anime, painting, sketch, watermark, text, low resolution"
      };
     
      try {
        output = await replicate.run(
          "prunaai/flux.1-dev:b0306d92aa025bb747dc74162f3c27d6ed83798e08e5f8977adf3d859d0536a3",
          { input: fluxInput }
        );
      } catch (fluxError) {
        console.log("Flux.1-dev failed, falling back to SDXL Lightning:", fluxError.message);
        // Fallback to SDXL Lightning if Flux fails
        const sdxlInput = {
          prompt: enhancedPrompt,
          width: Math.min(width, 1920),
          height: Math.min(height, 1280),
          num_outputs: 1,
          num_inference_steps: 10,
          guidance_scale: 7.5,
          negative_prompt: "blurry, low quality, distorted, unrealistic, cartoon, anime, painting, sketch, watermark, text"
        };
        
        try {
          output = await replicate.run(
            "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
            { input: sdxlInput }
          );
        } catch (sdxlError) {
          console.log("SDXL Lightning failed, falling back to basic SDXL:", sdxlError.message);
          // Final fallback to basic SDXL
          const basicSdxlInput = {
            prompt: enhancedPrompt,
            width: Math.min(width, 1024),
            height: Math.min(height, 1024),
            num_outputs: 1,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            negative_prompt: "blurry, low quality, distorted, unrealistic, cartoon, anime, painting, sketch, watermark, text"
          };
          
          output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            { input: basicSdxlInput }
          );
        }
      }
    }
    
    console.log("Enhanced static image output:", output);
    return output;
  } catch (error) {
    console.error("Error in generateStaticImage function:", error);
    throw error;
  }
}

async function generateAnimatedImage(replicate, enhancedPrompt, style, width, height, motionType, motionIntensity) {
  console.log(`generateAnimatedImage called with enhanced style: ${style}, motionType: ${motionType}, motionIntensity: ${motionIntensity}`);
  
  try {
    // Step 1: Generate a high-quality static image first
    console.log("Step 1: Generating enhanced base static image...");
    const staticImage = await generateStaticImage(replicate, enhancedPrompt, style, width, height);
    
    if (!staticImage || staticImage.length === 0) {
      throw new Error("Failed to generate base image for animation");
    }
    
    console.log("Static image result:", staticImage);
    console.log("Static image type:", typeof staticImage);
    console.log("Static image length:", staticImage?.length);
    
    // Handle both string and array responses
    let baseImageUrl;
    if (Array.isArray(staticImage)) {
      baseImageUrl = staticImage[0];
    } else if (typeof staticImage === 'string') {
      baseImageUrl = staticImage;
    } else {
      throw new Error("Invalid static image result format");
    }
    
    console.log("Base image URL:", baseImageUrl);
    
    // Validate and ensure the image URL is properly formatted
    if (!baseImageUrl || typeof baseImageUrl !== 'string') {
      throw new Error(`Invalid base image URL for animation: ${baseImageUrl}`);
    }
    
    // Ensure the URL is a proper URI
    if (!baseImageUrl.startsWith('http')) {
      throw new Error(`Base image URL must be a valid HTTP URI: ${baseImageUrl}`);
    }
    
    console.log("Enhanced base image URL (validated):", baseImageUrl);
    
    // Step 2: For now, just return the static image (motion will be handled by video creation process)
    console.log("Step 2: Returning static image (motion handled by video creation)");
    
    return baseImageUrl;
    
  } catch (error) {
    console.error("Error in generateAnimatedImage function:", error);
    
    // If animation fails, fall back to static image
    console.log("Animation failed, falling back to enhanced static image...");
    return await generateStaticImage(replicate, enhancedPrompt, style, width, height);
  }
}

