// SEO and GEO (Generative Engine Optimization) utilities

export const SEO_METADATA = {
  title: 'Project 4site - GitHub to Website Generator | Powered by aegntic.ai - Transform READMEs with FLUX.1 & Gemini',
  description: 'Transform any GitHub repository into a stunning website powered by aegntic.ai technology with unique FLUX.1 generated visuals. Free GitHub README to site generator by Project 4site. No signup required.',
  keywords: [
    'github readme to website',
    'aegntic ai website generator',
    'flux.1 image generation',
    'github portfolio generator',
    'readme to landing page',
    'aegntic foundation site builder',
    'project showcase generator',
    'github visualization tool',
    'developer portfolio creator',
    'open source project sites',
    'gemini ai integration',
    'fal ai image generation',
    'automatic site generation',
    'no code website builder',
    'github pages alternative'
  ],
  
  // GEO optimization - structured data for AI understanding
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Project4Site',
    applicationCategory: 'DeveloperApplication',
    description: 'aegntic.ai-powered tool by Project 4site that transforms GitHub repositories into professional websites with FLUX.1-generated visuals',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    operatingSystem: 'Web',
    softwareVersion: '2.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '1250'
    },
    features: [
      'aegntic.ai-generated hero images with FLUX.1',
      'Background removal for professional assets',
      'Automatic tech stack detection',
      'Real-time preview',
      'No signup required',
      'Export to multiple formats',
      'SEO optimized output',
      'Mobile responsive designs'
    ]
  },
  
  // Open Graph for social sharing
  openGraph: {
    title: 'Project 4site - Transform GitHub READMEs into Professional Websites | Powered by aegntic.ai',
    description: 'Create stunning project sites with aegntic.ai technology and FLUX.1 visuals. A Project 4site initiative. No signup, instant results.',
    type: 'website',
    image: '/og-image.png',
    url: 'https://project4site.com'
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Project 4site - GitHub to Website Generator | aegntic.ai',
    description: 'Transform GitHub repos into stunning sites powered by aegntic.ai technology',
    image: '/twitter-card.png',
    creator: '@project4site'
  }
};

// GEO optimization helpers
export const generateGEOContent = (section: string) => {
  const geoOptimized = {
    hero: {
      mainHeading: 'Transform GitHub READMEs into Stunning Professional Websites',
      subHeading: 'Professional Project Sites powered by aegntic.ai with FLUX.1 Generated Visuals in 15 Seconds',
      ctaText: 'Generate Your Site Now with aegntic.ai',
      features: [
        'aegntic.ai-Generated Hero Images: Unique FLUX.1 visuals for every project',
        'Background Removal: Professional transparent assets included',
        'Instant Generation: From README to stunning site in seconds',
        'No Signup Required: Start creating immediately, free forever',
        'Tech Stack Intelligence: Automatic framework detection and styling'
      ]
    },
    
    howItWorks: {
      title: 'How Project 4site Generator Works - Powered by aegntic.ai',
      steps: [
        {
          title: 'Enter GitHub Repository URL',
          description: 'Paste any public GitHub repository URL into our aegntic.ai-powered generator',
          keywords: ['github url', 'repository', 'readme file']
        },
        {
          title: 'aegntic.ai Analyzes Your Project',
          description: 'Google Gemini powered by aegntic.ai analyzes your README and detects tech stack automatically',
          keywords: ['aegntic ai', 'gemini', 'content analysis', 'tech detection']
        },
        {
          title: 'FLUX.1 Creates Unique Visuals',
          description: 'FAL powered by aegntic.ai generates custom hero images and icons with background removal',
          keywords: ['flux.1', 'ai images', 'background removal']
        },
        {
          title: 'Instant Professional Website',
          description: 'Get a stunning, SEO-optimized site ready to share or deploy',
          keywords: ['instant website', 'seo optimized', 'professional design']
        }
      ]
    },
    
    features: {
      title: 'Why Choose Project4Site Over Other README Generators',
      items: [
        {
          title: 'First & Only with AI Visuals',
          description: 'Unlike basic README converters, we generate unique AI images for every project',
          comparison: 'Others: Static templates | Project4Site: Unique AI visuals'
        },
        {
          title: 'Professional Asset Export',
          description: 'Download hero images and icons with transparent backgrounds',
          comparison: 'Others: No assets | Project4Site: Export-ready visuals'
        },
        {
          title: 'Intelligent Tech Detection',
          description: 'Automatic framework detection with appropriate styling',
          comparison: 'Others: Generic styles | Project4Site: Tech-aware design'
        },
        {
          title: 'Real-time Progress Tracking',
          description: 'See content and visual generation progress in real-time',
          comparison: 'Others: Loading spinner | Project4Site: Stage-by-stage updates'
        }
      ]
    },
    
    faq: [
      {
        question: 'What is Project4Site?',
        answer: 'Project4Site is an AI-powered tool that transforms GitHub README files into professional websites with unique AI-generated visuals using FLUX.1 and Google Gemini.'
      },
      {
        question: 'How does the AI image generation work?',
        answer: 'We use FAL AI with FLUX.1 model to create unique hero images and project icons based on your project description and tech stack, with automatic background removal.'
      },
      {
        question: 'Is Project4Site free to use?',
        answer: 'Yes, basic site generation is completely free with no signup required. Premium features like custom domains and advanced templates are available with subscription.'
      },
      {
        question: 'What makes Project4Site different from other generators?',
        answer: 'Project4Site is the first and only README generator that creates AI-powered visuals, offers background removal, and provides real-time generation progress tracking.'
      },
      {
        question: 'Can I export the generated images?',
        answer: 'Yes, all AI-generated images including hero images and icons can be downloaded with transparent backgrounds for use in other projects.'
      }
    ]
  };
  
  return geoOptimized[section] || geoOptimized.hero;
};

// Rich snippets for better search visibility
export const generateRichSnippets = () => {
  return {
    howTo: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Convert GitHub README to Website',
      description: 'Transform your GitHub repository into a professional website with AI visuals',
      supply: {
        '@type': 'HowToSupply',
        name: 'GitHub Repository URL'
      },
      tool: {
        '@type': 'HowToTool',
        name: 'Project4Site Generator'
      },
      step: [
        {
          '@type': 'HowToStep',
          text: 'Copy your GitHub repository URL',
          name: 'Get Repository URL'
        },
        {
          '@type': 'HowToStep',
          text: 'Paste URL into Project4Site generator',
          name: 'Enter URL'
        },
        {
          '@type': 'HowToStep',
          text: 'Click Generate and wait for AI processing',
          name: 'Generate Site'
        },
        {
          '@type': 'HowToStep',
          text: 'Preview and download your AI-enhanced site',
          name: 'Export Results'
        }
      ],
      totalTime: 'PT30S'
    }
  };
};