import * as fal from "@fal-ai/serverless-client";

// Configure FAL with the API key
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY
});

interface ImageGenerationResult {
  url: string;
  seed?: number;
  width: number;
  height: number;
}

interface BackgroundRemovalResult {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export interface GeneratedVisuals {
  heroImage: string;
  heroImageNoBackground: string;
  projectIcon: string;
  projectIconNoBackground: string;
  colorPalette: string[];
}

/**
 * Generate a hero image for the project using FLUX.1
 */
export const generateHeroImage = async (projectName: string, description: string, techStack: string[]): Promise<string> => {
  try {
    const prompt = `A stunning, professional hero image for a software project called "${projectName}". 
    ${description}. 
    Technologies: ${techStack.join(', ')}. 
    Style: Modern, minimalist, futuristic tech aesthetic with abstract geometric patterns, 
    gradient colors, and subtle code elements. Professional and visually striking. 
    High quality, 4K resolution, suitable for a landing page hero section.`;

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true
      }
    }) as { images: ImageGenerationResult[] };

    return result.images[0].url;
  } catch (error) {
    console.error("Error generating hero image:", error);
    throw new Error(`Failed to generate hero image: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate a project icon/logo
 */
export const generateProjectIcon = async (projectName: string, style: string = "modern"): Promise<string> => {
  try {
    const prompt = `A clean, modern icon/logo for a software project called "${projectName}". 
    Style: ${style}, minimalist, professional, suitable for use as an app icon or project logo. 
    Simple geometric shapes, bold colors, easily recognizable at small sizes. 
    Square aspect ratio, centered composition, high contrast.`;

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: "square",
        num_inference_steps: 25,
        guidance_scale: 7.5,
        num_images: 1,
        enable_safety_checker: true
      }
    }) as { images: ImageGenerationResult[] };

    return result.images[0].url;
  } catch (error) {
    console.error("Error generating project icon:", error);
    throw new Error(`Failed to generate project icon: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Remove background from an image
 */
export const removeBackground = async (imageUrl: string): Promise<string> => {
  try {
    const result = await fal.subscribe("fal-ai/birefnet", {
      input: {
        image_url: imageUrl
      }
    }) as BackgroundRemovalResult;

    return result.image.url;
  } catch (error) {
    console.error("Error removing background:", error);
    // Return original image if background removal fails
    return imageUrl;
  }
};

/**
 * Extract color palette from project description and tech stack
 */
export const generateColorPalette = (projectName: string, techStack: string[]): string[] => {
  // Define color associations for common tech stacks
  const techColors: Record<string, string[]> = {
    react: ["#61DAFB", "#282C34"],
    vue: ["#4FC08D", "#35495E"],
    angular: ["#DD0031", "#C3002F"],
    nodejs: ["#339933", "#333333"],
    python: ["#3776AB", "#FFD43B"],
    javascript: ["#F7DF1E", "#323330"],
    typescript: ["#3178C6", "#FFFFFF"],
    rust: ["#CE422B", "#000000"],
    go: ["#00ADD8", "#000000"],
    java: ["#007396", "#ED8B00"],
    default: ["#FFD700", "#000000", "#161b22", "#8b949e"]
  };

  // Find matching colors based on tech stack
  let palette = techColors.default;
  for (const tech of techStack) {
    const techLower = tech.toLowerCase();
    if (techColors[techLower]) {
      palette = [...techColors[techLower], ...palette];
      break;
    }
  }

  // Ensure unique colors and limit to 5
  return [...new Set(palette)].slice(0, 5);
};

/**
 * Generate all visuals for a project
 */
export const generateProjectVisuals = async (
  projectName: string,
  description: string,
  techStack: string[]
): Promise<GeneratedVisuals> => {
  try {
    // Generate images in parallel for faster processing
    const [heroImage, projectIcon] = await Promise.all([
      generateHeroImage(projectName, description, techStack),
      generateProjectIcon(projectName)
    ]);

    // Remove backgrounds in parallel
    const [heroImageNoBackground, projectIconNoBackground] = await Promise.all([
      removeBackground(heroImage),
      removeBackground(projectIcon)
    ]);

    // Generate color palette
    const colorPalette = generateColorPalette(projectName, techStack);

    return {
      heroImage,
      heroImageNoBackground,
      projectIcon,
      projectIconNoBackground,
      colorPalette
    };
  } catch (error) {
    console.error("Error generating project visuals:", error);
    // Return placeholder visuals on error
    return {
      heroImage: "",
      heroImageNoBackground: "",
      projectIcon: "",
      projectIconNoBackground: "",
      colorPalette: ["#FFD700", "#000000", "#161b22", "#8b949e"]
    };
  }
};

/**
 * Analyze visual style based on project type
 */
export const analyzeVisualStyle = (projectName: string, description: string, techStack: string[]): string => {
  const descLower = description.toLowerCase();
  const techJoined = techStack.join(' ').toLowerCase();
  
  if (descLower.includes('game') || descLower.includes('gaming')) {
    return 'vibrant, playful, dynamic, gaming-inspired';
  } else if (descLower.includes('enterprise') || descLower.includes('business')) {
    return 'professional, corporate, clean, trustworthy';
  } else if (descLower.includes('ai') || descLower.includes('machine learning') || descLower.includes('ml')) {
    return 'futuristic, high-tech, neural network patterns, gradient flows';
  } else if (techJoined.includes('blockchain') || techJoined.includes('crypto')) {
    return 'decentralized patterns, network nodes, modern fintech';
  } else if (descLower.includes('creative') || descLower.includes('design')) {
    return 'artistic, creative, colorful gradients, inspiring';
  } else {
    return 'modern, minimalist, professional, clean tech aesthetic';
  }
};