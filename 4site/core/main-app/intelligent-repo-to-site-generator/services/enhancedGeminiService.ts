import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_NAME, GEMINI_API_TIMEOUT_MS } from '../constants';

// Get API key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key not found. Please set the VITE_GEMINI_API_KEY environment variable.");
  throw new Error("Gemini API Key not configured");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ProjectMetadata {
  name: string;
  description: string;
  techStack: string[];
  category: string;
  features: string[];
}

export interface EnhancedSiteContent {
  markdown: string;
  metadata: ProjectMetadata;
}

const extractProjectName = (repoUrl: string): string => {
  const parts = repoUrl.split('/');
  const repoName = parts[parts.length - 1] || parts[parts.length - 2];
  return repoName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const generateContentWithTimeout = async (prompt: string): Promise<string> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Gemini API request timed out after ${GEMINI_API_TIMEOUT_MS / 1000} seconds.`)), GEMINI_API_TIMEOUT_MS);
  });

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });
    
    const resultPromise = (async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }
      return text;
    })();
    
    // Race between the API call and timeout
    const text = await Promise.race([resultPromise, timeoutPromise]);
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      // Check for specific API errors
      if (error.message.includes('API key not valid')) {
        throw new Error(`Gemini API error: Invalid API key. Please check your VITE_GEMINI_API_KEY in .env.local`);
      }
      if (error.message.includes('status: 400')) {
        throw new Error(`Gemini API error: ${error.message}. The AI model might be unavailable or the repository URL might be inaccessible. Please try again or use a different URL.`);
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }
    throw new Error(`Gemini API error: ${String(error)}`);
  }
};

export const generateEnhancedSiteContent = async (repoUrl: string): Promise<EnhancedSiteContent> => {
  const projectName = extractProjectName(repoUrl);
  
  const prompt = `
    You are an expert technical writer and AI assistant. Generate a professional project presentation for:
    
    GitHub Repository URL: ${repoUrl}
    Project Name: ${projectName}
    
    IMPORTANT: Return your response in the following JSON format:
    {
      "markdown": "# Project Title\\n\\n## Overview\\n...",
      "metadata": {
        "name": "Project Name",
        "description": "Brief project description (1-2 sentences)",
        "techStack": ["React", "TypeScript", "Node.js"],
        "category": "web|mobile|desktop|library|tool|other",
        "features": ["Feature 1", "Feature 2", "Feature 3"]
      }
    }
    
    For the markdown content, include these sections:
    1. Project Title (# heading)
    2. Hero Section with tagline
    3. Overview (## heading) - Compelling project description
    4. Key Features (## heading) - Impressive feature list with emojis
    5. Technology Stack (## heading) - Technologies with badges
    6. Getting Started (## heading) - Installation and usage
    7. Why Choose ${projectName}? (## heading) - Unique value propositions
    8. Live Demo/Links (## heading) - If applicable
    
    Make it engaging, professional, and suitable for a stunning landing page.
    Focus on benefits, not just features. Use emojis sparingly for visual appeal.
    
    For metadata:
    - name: Clean project name
    - description: Compelling 1-2 sentence description
    - techStack: Array of main technologies (max 5)
    - category: Choose from web, mobile, desktop, library, tool, or other
    - features: Top 3-5 features
    
    Return ONLY valid JSON, no additional text.
  `;

  try {
    const response = await generateContentWithTimeout(prompt);
    
    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(response);
      if (!parsed.markdown || !parsed.metadata) {
        throw new Error("Invalid response structure");
      }
      return parsed as EnhancedSiteContent;
    } catch (parseError) {
      // Fallback: extract what we can
      console.warn("Failed to parse JSON response, using fallback extraction", parseError);
      
      // Try to extract tech stack from response
      const techStackMatch = response.match(/(?:technologies?|tech stack|built with).*?:?\s*([^.]+)/i);
      const techStack = techStackMatch 
        ? techStackMatch[1].split(/[,\s]+/).filter(t => t.length > 0).slice(0, 5)
        : ['JavaScript', 'HTML', 'CSS'];
      
      // Extract description
      const descriptionMatch = response.match(/(?:overview|description|about).*?:?\s*([^.]+\.)/i);
      const description = descriptionMatch 
        ? descriptionMatch[1].trim()
        : `${projectName} is an innovative project that showcases modern development practices.`;
      
      // Extract features
      const featuresMatch = response.match(/(?:features?|capabilities).*?:?\s*((?:[-•*]\s*[^\n]+\n?){1,5})/i);
      const features = featuresMatch
        ? featuresMatch[1].split(/\n/).map(f => f.replace(/^[-•*]\s*/, '').trim()).filter(f => f.length > 0)
        : ['Modern Architecture', 'High Performance', 'Easy to Use'];
      
      return {
        markdown: response.includes('#') ? response : `# ${projectName}\n\n${response}`,
        metadata: {
          name: projectName,
          description,
          techStack,
          category: 'web',
          features
        }
      };
    }
  } catch (error) {
    console.error('Error generating enhanced site content:', error);
    throw error;
  }
};

export const enhanceContentWithVisuals = (
  markdown: string,
  visuals: {
    heroImage: string;
    projectIcon: string;
    colorPalette: string[];
  }
): string => {
  // Inject visual elements into the markdown
  const enhancedMarkdown = markdown.replace(
    /^(#\s+.+)$/m,
    `$1\n\n![Hero Image](${visuals.heroImage})\n`
  );
  
  // Add custom CSS variables for color palette
  const cssVars = visuals.colorPalette
    .map((color, i) => `  --project-color-${i + 1}: ${color};`)
    .join('\n');
  
  const styleBlock = `
<style>
:root {
${cssVars}
}
</style>
`;
  
  return styleBlock + enhancedMarkdown;
};