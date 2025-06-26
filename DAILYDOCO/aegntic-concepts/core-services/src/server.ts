import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

const fastify = Fastify({
  logger: true
});

// Security and CORS
fastify.register(cors, {
  origin: ['https://aegntic.ai', 'https://*.aegntic.ai', 'http://localhost:*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
});

// Concept Registry
const concepts = {
  'neural-nexus': {
    name: 'Neural Nexus',
    description: 'Interactive 3D brain network visualization',
    port: 3001,
    status: 'active'
  },
  'quantum-interface': {
    name: 'Quantum Interface', 
    description: 'Particle physics inspired morphing UI',
    port: 3002,
    status: 'active'
  },
  'digital-evolution': {
    name: 'Digital Evolution',
    description: 'Evolutionary algorithm visualizer',
    port: 3003,
    status: 'active'
  },
  'consciousness-stream': {
    name: 'Consciousness Stream',
    description: 'Flowing data consciousness metaphor', 
    port: 3004,
    status: 'active'
  },
  'matrix-architect': {
    name: 'Matrix Architect',
    description: 'Code-matrix reality builder interface',
    port: 3005,
    status: 'active'
  },
  'synthetic-dreams': {
    name: 'Synthetic Dreams',
    description: 'Surreal AI dream sequence interface',
    port: 3006,
    status: 'active'
  },
  'intelligence-singularity': {
    name: 'Intelligence Singularity',
    description: 'Converging AI capabilities visualization',
    port: 3007,
    status: 'active'
  },
  'computational-poetry': {
    name: 'Computational Poetry',
    description: 'AI as artistic expression platform',
    port: 3008,
    status: 'active'
  },
  'future-mirror': {
    name: 'Future Mirror',
    description: 'Predictive reality reflection interface',
    port: 3009,
    status: 'active'
  }
};

// API Routes
fastify.get('/api/concepts', async (request, reply) => {
  return { 
    concepts: Object.entries(concepts).map(([id, data]) => ({ id, ...data })),
    total: Object.keys(concepts).length
  };
});

fastify.get('/api/concepts/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const concept = concepts[id as keyof typeof concepts];
  
  if (!concept) {
    reply.code(404);
    return { error: 'Concept not found' };
  }
  
  return { id, ...concept };
});

fastify.get('/api/performance/metrics', async (request, reply) => {
  // Real-time performance metrics for all concepts
  const metrics = await Promise.all(
    Object.entries(concepts).map(async ([id, concept]) => {
      try {
        const response = await fetch(`http://localhost:${concept.port}/metrics`);
        const data = await response.json();
        return { id, ...data };
      } catch (error) {
        return { id, error: 'Service unavailable' };
      }
    })
  );
  
  return { metrics, timestamp: new Date().toISOString() };
});

fastify.get('/api/seo/optimize/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const concept = concepts[id as keyof typeof concepts];
  
  if (!concept) {
    reply.code(404);
    return { error: 'Concept not found' };
  }
  
  // Generate SEO optimization recommendations
  return {
    concept: id,
    optimizations: {
      title: `${concept.name} | Revolutionary AI Interface by Aegntic.ai`,
      description: `Experience ${concept.description} - cutting-edge AI interface technology that redefines human-computer interaction.`,
      keywords: ['ai', 'interface', 'aegntic', 'innovation', 'technology', concept.name.toLowerCase()],
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': concept.name,
        'description': concept.description,
        'applicationCategory': 'AI Interface',
        'operatingSystem': 'Web Browser',
        'author': {
          '@type': 'Organization',
          'name': 'Aegntic.ai',
          'email': 'contact@aegntic.ai'
        },
        'creator': {
          '@type': 'Person',
          'name': 'Mattae Cooper',
          'email': 'human@mattaecooper.org'
        }
      }
    }
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Aegntic Core Services running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();