import { generateProjectVisuals } from './falService';

// Pre-generated visuals for the landing page (fallback)
export const LANDING_PAGE_VISUALS = {
  heroImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop&auto=format',
  heroImageAlt: 'AI-powered futuristic code visualization with geometric patterns',
  projectIcon: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=512&h=512&fit=crop&auto=format',
  demoImages: [
    {
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop&auto=format',
      alt: 'React project transformed with AI visuals',
      title: 'React Projects',
      techStack: ['React', 'TypeScript', 'Vite']
    },
    {
      url: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop&auto=format',
      alt: 'Node.js backend visualization',
      title: 'Backend Systems',
      techStack: ['Node.js', 'Express', 'MongoDB']
    },
    {
      url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&auto=format',
      alt: 'Blockchain project with network visualization',
      title: 'Web3 Projects',
      techStack: ['Solidity', 'Ethereum', 'Web3.js']
    }
  ],
  colorPalette: ['#FFD700', '#1a1a1a', '#ffffff', '#666666', '#FFC107']
};

// Generate unique visuals for landing page on load
export const generateLandingPageVisuals = async () => {
  try {
    const visuals = await generateProjectVisuals(
      'Project4Site AI Platform',
      'Transform GitHub repositories into stunning AI-powered presentation websites with unique generated visuals',
      ['AI', 'React', 'TypeScript', 'FLUX.1', 'Gemini']
    );
    
    return {
      ...visuals,
      demoImages: await generateDemoImages()
    };
  } catch (error) {
    console.warn('Using fallback visuals for landing page:', error);
    return LANDING_PAGE_VISUALS;
  }
};

const generateDemoImages = async () => {
  // Generate demo images for different project types
  const demoProjects = [
    {
      name: 'React Showcase',
      description: 'Modern React application with AI enhancements',
      techStack: ['React', 'TypeScript', 'Vite'],
      style: 'modern, minimalist, blue accents'
    },
    {
      name: 'Python AI Project',
      description: 'Machine learning project with neural networks',
      techStack: ['Python', 'TensorFlow', 'FastAPI'],
      style: 'futuristic, neural network patterns, purple gradients'
    },
    {
      name: 'Rust System',
      description: 'High-performance system programming',
      techStack: ['Rust', 'WebAssembly', 'Tokio'],
      style: 'industrial, orange and black, geometric patterns'
    }
  ];

  try {
    const images = await Promise.all(
      demoProjects.map(async (project) => {
        const { generateHeroImage } = await import('./falService');
        const imageUrl = await generateHeroImage(
          project.name,
          project.description,
          project.techStack
        );
        
        return {
          url: imageUrl,
          alt: `${project.name} - AI generated visualization`,
          title: project.name,
          techStack: project.techStack
        };
      })
    );
    
    return images;
  } catch (error) {
    console.warn('Using fallback demo images:', error);
    return LANDING_PAGE_VISUALS.demoImages;
  }
};