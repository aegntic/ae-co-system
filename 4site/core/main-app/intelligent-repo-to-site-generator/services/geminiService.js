// ../utils/contentConverter.ts
function generateId() {
  return `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function determineTemplate(projectType) {
  const templateMap = {
    library: "documentation",
    application: "application",
    tool: "tool",
    framework: "documentation",
    other: "simple"
  };
  return templateMap[projectType] || "simple";
}
function generateColorFromTitle(title) {
  const colors = ["#3B82F6", "#8B5CF6", "#EF4444", "#10B981", "#F59E0B", "#EC4899"];
  const hash = title.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}
function extractRepoInfo(repoUrl) {
  try {
    const url = new URL(repoUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return {
      owner: pathParts[0] || "unknown",
      repo: pathParts[1] || "unknown"
    };
  } catch {
    return { owner: "unknown", repo: "unknown" };
  }
}
function mapProjectType(aiProjectType) {
  const typeMap = {
    library: "library",
    application: "tech",
    tool: "tool",
    framework: "library",
    other: "other"
  };
  return typeMap[aiProjectType] || "other";
}
function convertToSiteData(enhanced, repoUrl) {
  const { markdown, metadata } = enhanced;
  const id = generateId();
  const template = determineTemplate(metadata.projectType);
  const primaryColor = metadata.primaryColor || generateColorFromTitle(metadata.title);
  const { owner, repo } = extractRepoInfo(repoUrl);
  const projectType = mapProjectType(metadata.projectType);
  return {
    id,
    title: metadata.title,
    description: metadata.description,
    content: metadata.description,
    template,
    createdAt: new Date,
    repoUrl,
    githubUrl: repoUrl,
    generatedMarkdown: markdown,
    sections: [],
    features: metadata.features,
    techStack: metadata.techStack,
    projectType,
    primaryColor,
    owner,
    repo,
    tier: "premium"
  };
}

// geminiService.ts
var DEFAULT_OPENROUTER_KEY = atob("c2stb3ItdjEtYWVnbnQtNHNpdGVwcm8tZnJlZS1vbmx5LWtleQ==");
var OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || DEFAULT_OPENROUTER_KEY;
var FREE_MODELS = [
  {
    id: "mistralai/mistral-small-3.2-24b-instruct:free",
    name: "Mistral Small 3.2 24B",
    tier: "free",
    priority: 1,
    strengths: ["code-analysis", "technical-content", "problem-solving"],
    maxTokens: 96000,
    costPerRequest: 0
  },
  {
    id: "deepseek/deepseek-r1-0528:free",
    name: "DeepSeek R1 0528",
    tier: "free",
    priority: 2,
    strengths: ["reasoning", "chain-of-thought", "problem-solving"],
    maxTokens: 163840,
    costPerRequest: 0
  },
  {
    id: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    name: "DeepSeek R1 Qwen3 8B",
    tier: "free",
    priority: 3,
    strengths: ["math", "programming", "logic"],
    maxTokens: 131072,
    costPerRequest: 0
  },
  {
    id: "moonshotai/kimi-dev-72b:free",
    name: "Kimi Dev 72B",
    tier: "free",
    priority: 4,
    strengths: ["software-engineering", "bug-fixing", "code-reasoning"],
    maxTokens: 131072,
    costPerRequest: 0
  },
  {
    id: "sarvamai/sarvam-m:free",
    name: "Sarvam-M",
    tier: "free",
    priority: 5,
    strengths: ["multilingual", "reasoning", "general-purpose"],
    maxTokens: 32768,
    costPerRequest: 0
  }
];
var PRO_MODELS = [
  {
    id: "anthropic/claude-4-opus",
    name: "Claude 4 Opus",
    tier: "pro",
    priority: 1,
    strengths: ["advanced-reasoning", "complex-analysis", "quality"],
    maxTokens: 200000,
    costPerRequest: 0.15
  },
  {
    id: "openai/gpt-5-turbo",
    name: "GPT-5 Turbo",
    tier: "pro",
    priority: 2,
    strengths: ["creative-writing", "web-development", "innovation"],
    maxTokens: 128000,
    costPerRequest: 0.12
  },
  {
    id: "deepseek/deepseek-r1.1-pro",
    name: "DeepSeek R1.1 Pro",
    tier: "pro",
    priority: 3,
    strengths: ["code-generation", "technical-precision", "optimization"],
    maxTokens: 32768,
    costPerRequest: 0.08
  }
];
var PRIMARY_MODEL = FREE_MODELS[0].id;
async function generateEnhancedSiteContent(repoUrl, apiKey, modelOverride) {
  const effectiveApiKey = apiKey || OPENROUTER_API_KEY;
  const isDefaultKey = effectiveApiKey === DEFAULT_OPENROUTER_KEY;
  const availableFreeModelIds = FREE_MODELS.map((m) => m.id);
  const selectedModel = isDefaultKey ? modelOverride && availableFreeModelIds.includes(modelOverride) ? modelOverride : PRIMARY_MODEL : modelOverride || PRO_MODELS[0].id;
  if (!effectiveApiKey || effectiveApiKey === "PLACEHOLDER_API_KEY") {
    throw new Error("OpenRouter API key not provided. Please enter your OpenRouter API key to generate AI-powered sites.");
  }
  const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, "").split("/");
  const owner = urlParts[0];
  const repo = urlParts[1];
  const readmeUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  const response = await fetch(readmeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.statusText}`);
  }
  const readmeData = await response.json();
  const readmeContent = atob(readmeData.content);
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const [repoResponse, languagesResponse, contentsResponse] = await Promise.allSettled([
    fetch(repoApiUrl),
    fetch(`${repoApiUrl}/languages`),
    fetch(`${repoApiUrl}/contents`)
  ]);
  let repoData = null;
  let languages = null;
  let contents = null;
  if (repoResponse.status === "fulfilled" && repoResponse.value.ok) {
    repoData = await repoResponse.value.json();
  }
  if (languagesResponse.status === "fulfilled" && languagesResponse.value.ok) {
    languages = await languagesResponse.value.json();
  }
  if (contentsResponse.status === "fulfilled" && contentsResponse.value.ok) {
    contents = await contentsResponse.value.json();
  }
  const prompt = `Perform comprehensive repository analysis and generate a professional website. This is NOT just a README converter - analyze the entire repository structure, technology stack, and codebase patterns:

REPOSITORY DATA:
- Repository: ${owner}/${repo}
- URL: ${repoUrl}
- Description: ${repoData?.description || "No description"}
- Stars: ${repoData?.stargazers_count || 0}
- Forks: ${repoData?.forks_count || 0}
- Language: ${repoData?.language || "Unknown"}
- Created: ${repoData?.created_at || "Unknown"}
- Last Updated: ${repoData?.updated_at || "Unknown"}
- Topics: ${repoData?.topics?.join(", ") || "None"}
- Homepage: ${repoData?.homepage || "None"}

TECHNOLOGY STACK:
${languages ? Object.entries(languages).map(([lang, bytes]) => `- ${lang}: ${Math.round(bytes / 1000)}KB`).join(`
`) : "Languages data not available"}

REPOSITORY STRUCTURE:
${contents ? contents.slice(0, 20).map((item) => `- ${item.name} (${item.type})`).join(`
`) : "Structure data not available"}

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
  const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${effectiveApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://4site.pro",
      "X-Title": "4site.pro - Living Websites That Update Themselves"
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 4000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })
  });
  if (!apiResponse.ok) {
    const errorData = await apiResponse.text();
    throw new Error(`4site.pro AI Service error: ${apiResponse.status} - ${errorData}`);
  }
  const data = await apiResponse.json();
  const response_text = data.choices[0]?.message?.content;
  if (!response_text) {
    throw new Error("No response from 4site.pro AI Service");
  }
  try {
    const parsed = JSON.parse(response_text);
    return {
      markdown: parsed.markdown,
      metadata: parsed.metadata,
      generatedAt: new Date,
      aiModel: selectedModel,
      confidence: 0.95
    };
  } catch (error) {
    console.error("Failed to parse AI response:", response_text);
    throw new Error("Invalid response from AI service");
  }
}
var generateSiteContentFromUrl = async (repoUrl, apiKey) => {
  const effectiveApiKey = apiKey || OPENROUTER_API_KEY;
  const hasValidApiKey = effectiveApiKey && effectiveApiKey !== "PLACEHOLDER_API_KEY" && effectiveApiKey !== "DEMO_KEY_FOR_TESTING" && effectiveApiKey !== DEFAULT_OPENROUTER_KEY;
  const urlParts = repoUrl.replace(/^https?:\/\//, "").split("/");
  if (urlParts.length < 3) {
    throw new Error("Invalid GitHub URL format. Expected: https://github.com/owner/repo");
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
      console.warn("AI generation failed, falling back to repository analysis:", error);
    }
  }
  console.log(`Generating content for ${owner}/${repo} using repository analysis (fallback mode)...`);
  return await generateFallbackSiteContent(repoUrl);
};
async function generateFallbackSiteContent(repoUrl) {
  const urlParts = repoUrl.replace(/^https?:\/\/github\.com\//, "").split("/");
  const owner = urlParts[0];
  const repo = urlParts[1];
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const [repoResponse, languagesResponse, readmeResponse] = await Promise.allSettled([
    fetch(repoApiUrl),
    fetch(`${repoApiUrl}/languages`),
    fetch(`${repoApiUrl}/readme`)
  ]);
  let repoData = null;
  let languages = null;
  let readmeContent = "";
  if (repoResponse.status === "fulfilled" && repoResponse.value.ok) {
    repoData = await repoResponse.value.json();
  }
  if (languagesResponse.status === "fulfilled" && languagesResponse.value.ok) {
    languages = await languagesResponse.value.json();
  }
  if (readmeResponse.status === "fulfilled" && readmeResponse.value.ok) {
    const readmeData = await readmeResponse.value.json();
    readmeContent = atob(readmeData.content);
  }
  if (!repoData) {
    throw new Error("Repository not found or is private");
  }
  const techStack = languages ? Object.keys(languages) : ["Unknown"];
  const primaryLanguage = repoData.language || techStack[0] || "Unknown";
  const languageColors = {
    JavaScript: "#f7df1e",
    TypeScript: "#3178c6",
    Python: "#3776ab",
    Java: "#007396",
    "C++": "#00599c",
    "C#": "#239120",
    Go: "#00add8",
    Rust: "#ce422b",
    PHP: "#777bb4",
    Ruby: "#cc342d",
    Swift: "#fa7343",
    Kotlin: "#7f52ff",
    Scala: "#dc322f",
    Dart: "#0175c2",
    HTML: "#e34f26",
    CSS: "#1572b6",
    Vue: "#4fc08d",
    React: "#61dafb",
    Angular: "#dd0031"
  };
  const primaryColor = languageColors[primaryLanguage] || "#ffd700";
  const description = repoData.description || `${primaryLanguage} project by ${owner}`;
  let projectType = "application";
  const repoNameLower = repo.toLowerCase();
  const descLower = description.toLowerCase();
  if (descLower.includes("library") || descLower.includes("package") || descLower.includes("module")) {
    projectType = "library";
  } else if (descLower.includes("tool") || descLower.includes("cli") || descLower.includes("utility")) {
    projectType = "tool";
  } else if (descLower.includes("framework") || descLower.includes("boilerplate")) {
    projectType = "framework";
  }
  const features = extractFeaturesFromReadme(readmeContent, repoData);
  const useCases = generateUseCases(projectType, primaryLanguage, description);
  const markdown = generateProfessionalMarkdown(repoData, readmeContent, features);
  const siteData = {
    title: repoData.name || repo,
    description,
    content: markdown,
    features,
    techStack,
    projectType,
    primaryLanguage,
    targetAudience: ["developers", "engineers", "tech professionals"],
    useCases,
    primaryColor,
    owner,
    repo,
    repoUrl,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    language: primaryLanguage,
    topics: repoData.topics || [],
    homepage: repoData.homepage || "",
    createdAt: repoData.created_at || "",
    updatedAt: repoData.updated_at || "",
    generatedAt: new Date,
    aiGenerated: false
  };
  return siteData;
}
function extractFeaturesFromReadme(readmeContent, repoData) {
  const features = [];
  const featurePatterns = [
    /(?:^|\n)[-*+]\s+(.+)$/gm,
    /(?:^|\n)##?\s*Features?\s*\n([\s\S]*?)(?:\n##|$)/i,
    /(?:^|\n)##?\s*What it does\s*\n([\s\S]*?)(?:\n##|$)/i
  ];
  for (const pattern of featurePatterns) {
    const matches = readmeContent.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const cleaned = match.replace(/^[-*+#\s]+/, "").trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          features.push(cleaned);
        }
      });
    }
  }
  if (features.length === 0) {
    if (repoData.language) {
      features.push(`${repoData.language} implementation`);
    }
    if (repoData.stargazers_count > 100) {
      features.push("Community-driven development");
    }
    if (repoData.topics && repoData.topics.length > 0) {
      repoData.topics.slice(0, 3).forEach((topic) => {
        features.push(`${topic.charAt(0).toUpperCase() + topic.slice(1)} integration`);
      });
    }
    if (features.length === 0) {
      features.push("Professional software solution");
    }
  }
  return features.slice(0, 6);
}
function generateUseCases(projectType, language, description) {
  const useCases = [];
  switch (projectType) {
    case "library":
      useCases.push("Integration in larger applications", "Code reusability", "Development acceleration");
      break;
    case "tool":
      useCases.push("Development workflow optimization", "Automation tasks", "Productivity enhancement");
      break;
    case "framework":
      useCases.push("Rapid application development", "Standardized architecture", "Best practices implementation");
      break;
    default:
      useCases.push("Production deployment", "Development projects", "Learning and education");
  }
  const languageUseCases = {
    JavaScript: ["Web development", "Frontend applications"],
    TypeScript: ["Type-safe development", "Large-scale applications"],
    Python: ["Data science", "Machine learning", "Automation"],
    Java: ["Enterprise applications", "Backend services"],
    React: ["User interface development", "Component-based architecture"],
    Vue: ["Progressive web applications", "Frontend frameworks"],
    Go: ["Microservices", "Cloud native applications"],
    Rust: ["System programming", "Performance-critical applications"]
  };
  if (languageUseCases[language]) {
    useCases.push(...languageUseCases[language]);
  }
  return [...new Set(useCases)].slice(0, 4);
}
function generateProfessionalMarkdown(repoData, readmeContent, features) {
  const projectName = repoData.name || "Project";
  const description = repoData.description || "Professional software project";
  return `# ${projectName}

${description}

## Overview

${projectName} is a ${repoData.language || "software"} project that provides professional-grade functionality for developers and technical teams.

${readmeContent ? `## Documentation

` + readmeContent.substring(0, 2000) + (readmeContent.length > 2000 ? `...

[View full documentation on GitHub](https://github.com/` + repoData.full_name + ")" : "") : ""}

## Key Features

${features.map((feature) => `- ${feature}`).join(`
`)}

## Technical Details

- **Primary Language**: ${repoData.language || "Unknown"}
- **Repository**: [${repoData.full_name}](https://github.com/${repoData.full_name})
- **Stars**: ${repoData.stargazers_count || 0}
- **Forks**: ${repoData.forks_count || 0}
- **Created**: ${repoData.created_at ? new Date(repoData.created_at).toLocaleDateString() : "Unknown"}
- **Last Updated**: ${repoData.updated_at ? new Date(repoData.updated_at).toLocaleDateString() : "Unknown"}

${repoData.topics && repoData.topics.length > 0 ? `## Topics

${repoData.topics.map((topic) => `\`${topic}\``).join(" ")}` : ""}

${repoData.homepage ? `## Live Demo

[View Live Demo](${repoData.homepage})` : ""}

## Getting Started

Visit the [GitHub repository](https://github.com/${repoData.full_name}) for installation instructions, documentation, and contribution guidelines.

---

*This professional website was generated automatically from the GitHub repository using 4site.pro - Living Websites That Update Themselves*`;
}
export {
  generateSiteContentFromUrl
};
export async function generateSiteFromRepo(repoUrl, options = {}) { 
  const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY || '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';
  const siteData = await generateSiteContentFromUrl(repoUrl, OPENROUTER_API_KEY);
  
  // Apply aeLTD premium template if enabled
  if (options.usePremiumTemplate !== false) {
    try {
      // Dynamically import the template engine
      const { AELTDTemplateEngine } = await import('./aeltdTemplateEngine.js');
      const templateEngine = new AELTDTemplateEngine();
      
      // Select best matching template based on repo analysis
      const selectedTemplate = templateEngine.selectBestTemplate({
        projectType: siteData.projectType || 'application',
        language: siteData.language || siteData.primaryLanguage || 'JavaScript',
        techStack: siteData.techStack || [],
        features: siteData.features || [],
        description: siteData.description || ''
      });
      
      // Apply template to site data
      const enhancedSiteData = templateEngine.applyTemplate(siteData, selectedTemplate);
      
      // Generate template-specific HTML if needed
      if (options.generateHTML) {
        enhancedSiteData.generatedHTML = templateEngine.generateTemplateHTML(enhancedSiteData, selectedTemplate);
      }
      
      console.log(`🎨 Applied aeLTD Premium Template: ${selectedTemplate.title} (${selectedTemplate.aeltd_id})`);
      return enhancedSiteData;
      
    } catch (error) {
      console.warn('Failed to apply premium template, using default:', error);
    }
  }
  
  return siteData;
}
