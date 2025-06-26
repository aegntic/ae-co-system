import { SiteData } from '../types';
import { EnhancedSiteContent } from '../enhanced-content-types';
import { convertToSiteData } from '../utils/contentConverter';

// 4SITE.PRO - Enterprise AI Ensemble Configuration
const DEFAULT_OPENROUTER_KEY = atob('c2stb3ItdjEtYWVnbnQtNHNpdGVwcm8tZnJlZS1vbmx5LWtleQ=='); // Free tier key
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY;

// Multi-Model Ensemble - Updated Free Tier (latest working models from OpenRouter)
const FREE_MODELS = [
  { 
    id: 'mistralai/mistral-small-3.2-24b-instruct:free', 
    name: 'Mistral Small 3.2 24B', 
    tier: 'free', 
    priority: 1,
    strengths: ['code-analysis', 'technical-content', 'problem-solving'],
    maxTokens: 96000,
    costPerRequest: 0
  },
  { 
    id: 'deepseek/deepseek-r1-0528:free', 
    name: 'DeepSeek R1 0528', 
    tier: 'free', 
    priority: 2,
    strengths: ['reasoning', 'chain-of-thought', 'problem-solving'],
    maxTokens: 163840,
    costPerRequest: 0
  },
  { 
    id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', 
    name: 'DeepSeek R1 Qwen3 8B', 
    tier: 'free', 
    priority: 3,
    strengths: ['math', 'programming', 'logic'],
    maxTokens: 131072,
    costPerRequest: 0
  },
  { 
    id: 'moonshotai/kimi-dev-72b:free', 
    name: 'Kimi Dev 72B', 
    tier: 'free', 
    priority: 4,
    strengths: ['software-engineering', 'bug-fixing', 'code-reasoning'],
    maxTokens: 131072,
    costPerRequest: 0
  },
  { 
    id: 'sarvamai/sarvam-m:free', 
    name: 'Sarvam-M', 
    tier: 'free', 
    priority: 5,
    strengths: ['multilingual', 'reasoning', 'general-purpose'],
    maxTokens: 32768,
    costPerRequest: 0
  }
];

// Pro Tier Models (Claude 4, GPT-5, DeepSeek R1.1 Pro)
const PRO_MODELS = [
  { 
    id: 'anthropic/claude-4-opus', 
    name: 'Claude 4 Opus', 
    tier: 'pro', 
    priority: 1,
    strengths: ['advanced-reasoning', 'complex-analysis', 'quality'],
    maxTokens: 200000,
    costPerRequest: 0.15
  },
  { 
    id: 'openai/gpt-5-turbo', 
    name: 'GPT-5 Turbo', 
    tier: 'pro', 
    priority: 2,
    strengths: ['creative-writing', 'web-development', 'innovation'],
    maxTokens: 128000,
    costPerRequest: 0.12
  },
  { 
    id: 'deepseek/deepseek-r1.1-pro', 
    name: 'DeepSeek R1.1 Pro', 
    tier: 'pro', 
    priority: 3,
    strengths: ['code-generation', 'technical-precision', 'optimization'],
    maxTokens: 32768,
    costPerRequest: 0.08
  }
];

// Primary model for free tier
const PRIMARY_MODEL = FREE_MODELS[0].id; // DeepSeek R1.1 as primary

const OPENROUTER_API_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

async function generateEnhancedSiteContent(repoUrl: string, apiKey?: string, modelOverride?: string): Promise<EnhancedSiteContent> {
  const effectiveApiKey = apiKey || OPENROUTER_API_KEY;
  const isDefaultKey = effectiveApiKey === DEFAULT_OPENROUTER_KEY;
  
  // Multi-Model Selection: Free tier uses ensemble approach
  const availableFreeModelIds = FREE_MODELS.map(m => m.id);
  const selectedModel = isDefaultKey 
    ? (modelOverride && availableFreeModelIds.includes(modelOverride) ? modelOverride : PRIMARY_MODEL)
    : (modelOverride || PRO_MODELS[0].id);
  
  // Validate API key before proceeding
  if (!effectiveApiKey || effectiveApiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error('OpenRouter API key not provided. Please enter your OpenRouter API key to generate AI-powered sites.');
  }
  
  // Extract repo info
  const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, '').split('/');
  const owner = urlParts[0];
  const repo = urlParts[1];
  
  // Fetch README content
  const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const response = await fetch(readmeUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.statusText}`);
  }
  
  const readmeData = await response.json();
  const readmeContent = atob(readmeData.content);
  
  // Fetch additional repository data for comprehensive analysis
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const [repoResponse, languagesResponse, contentsResponse] = await Promise.allSettled([
    fetch(repoApiUrl),
    fetch(`${repoApiUrl}/languages`),
    fetch(`${repoApiUrl}/contents`)
  ]);

  let repoData = null;
  let languages = null;
  let contents = null;

  if (repoResponse.status === 'fulfilled' && repoResponse.value.ok) {
    repoData = await repoResponse.value.json();
  }
  if (languagesResponse.status === 'fulfilled' && languagesResponse.value.ok) {
    languages = await languagesResponse.value.json();
  }
  if (contentsResponse.status === 'fulfilled' && contentsResponse.value.ok) {
    contents = await contentsResponse.value.json();
  }

  const prompt = `Perform comprehensive repository analysis and generate a professional website. This is NOT just a README converter - analyze the entire repository structure, technology stack, and codebase patterns:

REPOSITORY DATA:
- Repository: ${owner}/${repo}
- URL: ${repoUrl}
- Description: ${repoData?.description || 'No description'}
- Stars: ${repoData?.stargazers_count || 0}
- Forks: ${repoData?.forks_count || 0}
- Language: ${repoData?.language || 'Unknown'}
- Created: ${repoData?.created_at || 'Unknown'}
- Last Updated: ${repoData?.updated_at || 'Unknown'}
- Topics: ${repoData?.topics?.join(', ') || 'None'}
- Homepage: ${repoData?.homepage || 'None'}

TECHNOLOGY STACK:
${languages ? Object.entries(languages).map(([lang, bytes]) => `- ${lang}: ${Math.round((bytes as number) / 1000)}KB`).join('\n') : 'Languages data not available'}

REPOSITORY STRUCTURE:
${contents ? contents.slice(0, 20).map((item: any) => `- ${item.name} (${item.type})`).join('\n') : 'Structure data not available'}

README CONTENT:
${readmeContent}

1. **Complete Technology Analysis** - Not just what's in the README, but actual codebase patterns, architecture decisions, and technical implementation
2. **Professional Project Presentation** - Enterprise-grade documentation and feature showcase
3. **Comprehensive Feature Extraction** - Based on both documentation and actual code structure
4. **Deployment and Integration Guides** - Practical implementation information
5. **Architecture and Dependencies** - Technical depth that showcases the full project scope

Please analyze this and provide a JSON response with:
{
  "metadata": {
    "title": "Project title",
    "description": "Brief description for hero section", 
    "projectType": "library|application|tool|framework|other",
    "primaryLanguage": "Main programming language",
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "techStack": ["Technology 1", "Technology 2"],
    "targetAudience": ["developers", "businesses", etc],
    "useCases": ["Use case 1", "Use case 2"],
    "primaryColor": "#hexcolor"
  },
  "markdown": "Enhanced markdown content for the site"
}

Focus on:
1. Extract key features and benefits
2. Identify technology stack
3. Create compelling description
4. Generate appropriate color based on the project
5. Ensure the content is engaging and informative

Respond with ONLY the JSON, no other text.`;

  const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://4site.pro',
      'X-Title': '4site.pro - Living Websites That Update Themselves'
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6, // Slightly more focused for professional content
      max_tokens: 4000,
      presence_penalty: 0.1, // Encourage diverse professional vocabulary
      frequency_penalty: 0.1 // Reduce repetition
    })
  });

  if (!apiResponse.ok) {
    const errorData = await apiResponse.text();
    throw new Error(`4site.pro AI Service error: ${apiResponse.status} - ${errorData}`);
  }

  const data = await apiResponse.json();
  const response_text = data.choices[0]?.message?.content;

  if (!response_text) {
    throw new Error('No response from 4site.pro AI Service');
  }
  
  try {
    const parsed = JSON.parse(response_text);
    return {
      markdown: parsed.markdown,
      metadata: parsed.metadata,
      generatedAt: new Date(),
      aiModel: selectedModel,
      confidence: 0.95
    };
  } catch (error) {
    console.error('Failed to parse AI response:', response_text);
    throw new Error('Invalid response from AI service');
  }
}


export const generateSiteContentFromUrl = async (repoUrl: string, apiKey?: string): Promise<SiteData> => {
  const effectiveApiKey = apiKey || OPENROUTER_API_KEY;
  
  // Check if API key is configured but allow fallback mode
  const hasValidApiKey = effectiveApiKey && 
    effectiveApiKey !== 'PLACEHOLDER_API_KEY' && 
    effectiveApiKey !== 'DEMO_KEY_FOR_TESTING' &&
    effectiveApiKey !== DEFAULT_OPENROUTER_KEY;
  
  const urlParts = repoUrl.replace(/^https?:\/\//, '').split('/');
  if (urlParts.length < 3) {
    throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
  }
  
  const owner = urlParts[1];
  const repo = urlParts[2];
  
  if (hasValidApiKey) {
    console.log(`Generating enhanced content for ${owner}/${repo} using OpenRouter...`);
    
    try {
      const enhancedContent = await generateEnhancedSiteContent(repoUrl, effectiveApiKey);
      const siteData = convertToSiteData(enhancedContent, repoUrl);
      
      siteData.owner = owner;
      siteData.repo = repo;
      siteData.repoUrl = repoUrl;
      
      return siteData;
    } catch (error) {
      console.warn('AI generation failed, falling back to repository analysis:', error);
      // Fall through to fallback mode
    }
  }
  
  // Fallback mode: Generate content from repository analysis only
  console.log(`Generating content for ${owner}/${repo} using repository analysis (fallback mode)...`);
  return await generateFallbackSiteContent(repoUrl);
};

/**
 * Fallback content generation using only repository analysis
 * This provides professional content without requiring AI API access
 */
async function generateFallbackSiteContent(repoUrl: string): Promise<SiteData> {
  const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, '').split('/');
  const owner = urlParts[0];
  const repo = urlParts[1];
  
  // Fetch repository data from GitHub API
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const [repoResponse, languagesResponse, readmeResponse] = await Promise.allSettled([
    fetch(repoApiUrl),
    fetch(`${repoApiUrl}/languages`),
    fetch(`${repoApiUrl}/readme`)
  ]);

  let repoData = null;
  let languages = null;
  let readmeContent = '';

  if (repoResponse.status === 'fulfilled' && repoResponse.value.ok) {
    repoData = await repoResponse.value.json();
  }
  if (languagesResponse.status === 'fulfilled' && languagesResponse.value.ok) {
    languages = await languagesResponse.value.json();
  }
  if (readmeResponse.status === 'fulfilled' && readmeResponse.value.ok) {
    const readmeData = await readmeResponse.value.json();
    readmeContent = atob(readmeData.content);
  }

  if (!repoData) {
    throw new Error('Repository not found or is private');
  }

  // Extract technology stack from languages
  const techStack = languages ? Object.keys(languages) : ['Unknown'];
  const primaryLanguage = repoData.language || techStack[0] || 'Unknown';
  
  // Generate color scheme based on primary language
  const languageColors: Record<string, string> = {
    JavaScript: '#f7df1e',
    TypeScript: '#3178c6',
    Python: '#3776ab',
    Java: '#007396',
    'C++': '#00599c',
    'C#': '#239120',
    Go: '#00add8',
    Rust: '#ce422b',
    PHP: '#777bb4',
    Ruby: '#cc342d',
    Swift: '#fa7343',
    Kotlin: '#7f52ff',
    Scala: '#dc322f',
    Dart: '#0175c2',
    HTML: '#e34f26',
    CSS: '#1572b6',
    Vue: '#4fc08d',
    React: '#61dafb',
    Angular: '#dd0031'
  };
  
  const primaryColor = languageColors[primaryLanguage] || '#ffd700';
  
  // Generate professional description
  const description = repoData.description || `${primaryLanguage} project by ${owner}`;
  
  // Determine project type
  let projectType = 'application';
  const repoNameLower = repo.toLowerCase();
  const descLower = description.toLowerCase();
  
  if (descLower.includes('library') || descLower.includes('package') || descLower.includes('module')) {
    projectType = 'library';
  } else if (descLower.includes('tool') || descLower.includes('cli') || descLower.includes('utility')) {
    projectType = 'tool';
  } else if (descLower.includes('framework') || descLower.includes('boilerplate')) {
    projectType = 'framework';
  }
  
  // Extract features from README content
  const features = extractFeaturesFromReadme(readmeContent, repoData);
  
  // Generate use cases based on project type and language
  const useCases = generateUseCases(projectType, primaryLanguage, description);
  
  // Generate professional markdown content
  const markdown = generateProfessionalMarkdown(repoData, readmeContent, features);
  
  const siteData: SiteData = {
    title: repoData.name || repo,
    description,
    content: markdown,
    features,
    techStack,
    projectType,
    primaryLanguage,
    targetAudience: ['developers', 'engineers', 'tech professionals'],
    useCases,
    primaryColor,
    owner,
    repo,
    repoUrl,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    language: primaryLanguage,
    topics: repoData.topics || [],
    homepage: repoData.homepage || '',
    createdAt: repoData.created_at || '',
    updatedAt: repoData.updated_at || '',
    generatedAt: new Date(),
    aiGenerated: false // Indicates this was generated without AI
  };
  
  return siteData;
}

function extractFeaturesFromReadme(readmeContent: string, repoData: any): string[] {
  const features: string[] = [];
  
  // Look for common feature indicators in README
  const featurePatterns = [
    /(?:^|\n)[-*+]\s+(.+)$/gm,  // Bullet points
    /(?:^|\n)##?\s*Features?\s*\n([\s\S]*?)(?:\n##|$)/i,  // Features section
    /(?:^|\n)##?\s*What it does\s*\n([\s\S]*?)(?:\n##|$)/i,  // What it does section
  ];
  
  for (const pattern of featurePatterns) {
    const matches = readmeContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const cleaned = match.replace(/^[-*+#\s]+/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          features.push(cleaned);
        }
      });
    }
  }
  
  // If no features found, generate some based on repository data
  if (features.length === 0) {
    if (repoData.language) {
      features.push(`${repoData.language} implementation`);
    }
    if (repoData.stargazers_count > 100) {
      features.push('Community-driven development');
    }
    if (repoData.topics && repoData.topics.length > 0) {
      repoData.topics.slice(0, 3).forEach((topic: string) => {
        features.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)} integration`);
      });
    }
    if (features.length === 0) {
      features.push('Professional software solution');
    }
  }
  
  return features.slice(0, 6); // Limit to 6 features
}

function generateUseCases(projectType: string, language: string, description: string): string[] {
  const useCases: string[] = [];
  
  switch (projectType) {
    case 'library':
      useCases.push('Integration in larger applications', 'Code reusability', 'Development acceleration');
      break;
    case 'tool':
      useCases.push('Development workflow optimization', 'Automation tasks', 'Productivity enhancement');
      break;
    case 'framework':
      useCases.push('Rapid application development', 'Standardized architecture', 'Best practices implementation');
      break;
    default:
      useCases.push('Production deployment', 'Development projects', 'Learning and education');
  }
  
  // Add language-specific use cases
  const languageUseCases: Record<string, string[]> = {
    JavaScript: ['Web development', 'Frontend applications'],
    TypeScript: ['Type-safe development', 'Large-scale applications'],
    Python: ['Data science', 'Machine learning', 'Automation'],
    Java: ['Enterprise applications', 'Backend services'],
    React: ['User interface development', 'Component-based architecture'],
    Vue: ['Progressive web applications', 'Frontend frameworks'],
    Go: ['Microservices', 'Cloud native applications'],
    Rust: ['System programming', 'Performance-critical applications'],
  };
  
  if (languageUseCases[language]) {
    useCases.push(...languageUseCases[language]);
  }
  
  return [...new Set(useCases)].slice(0, 4); // Remove duplicates and limit to 4
}

function generateProfessionalMarkdown(repoData: any, readmeContent: string, features: string[]): string {
  const projectName = repoData.name || 'Project';
  const description = repoData.description || 'Professional software project';
  
  return `# ${projectName}

${description}

## Overview

${projectName} is a ${repoData.language || 'software'} project that provides professional-grade functionality for developers and technical teams.

${readmeContent ? '## Documentation\n\n' + readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? '...\n\n[View full documentation on GitHub](https://github.com/' + repoData.full_name + ')' : '') : ''}

## Key Features

${features.map(feature => `- ${feature}`).join('\n')}

## Technical Details

- **Primary Language**: ${repoData.language || 'Unknown'}
- **Repository**: [${repoData.full_name}](https://github.com/${repoData.full_name})
- **Stars**: ${repoData.stargazers_count || 0}
- **Forks**: ${repoData.forks_count || 0}
- **Created**: ${repoData.created_at ? new Date(repoData.created_at).toLocaleDateString() : 'Unknown'}
- **Last Updated**: ${repoData.updated_at ? new Date(repoData.updated_at).toLocaleDateString() : 'Unknown'}

${repoData.topics && repoData.topics.length > 0 ? `## Topics\n\n${repoData.topics.map((topic: string) => `\`${topic}\``).join(' ')}` : ''}

${repoData.homepage ? `## Live Demo\n\n[View Live Demo](${repoData.homepage})` : ''}

## Getting Started

Visit the [GitHub repository](https://github.com/${repoData.full_name}) for installation instructions, documentation, and contribution guidelines.

---

*This professional website was generated automatically from the GitHub repository using 4site.pro - Living Websites That Update Themselves*`;
}