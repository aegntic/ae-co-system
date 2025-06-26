
import Fastify from 'fastify';
import { z } from 'zod';
import process from 'node:process';

const GITHUB_APP_SERVICE_URL = process.env.GITHUB_APP_SERVICE_URL || 'http://localhost:3001';

const fastify = Fastify({
  logger: true,
});

// Basic health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', service: 'api-gateway' };
});

const GenerateSiteRequestSchema = z.object({
  repoUrl: z.string().url({ message: "Invalid GitHub repository URL" }),
});

// Route to initiate site generation
fastify.post('/api/initiate-generation', async (request, reply) => {
  try {
    const validatedBody = GenerateSiteRequestSchema.safeParse(request.body);
    if (!validatedBody.success) {
      return reply.status(400).send({ error: "Invalid request body", details: validatedBody.error.flatten() });
    }

    const { repoUrl } = validatedBody.data;

    // Forward request to GitHub App Service
    // In a real scenario, you might add auth, rate limiting, etc. here.
    const githubAppServiceResponse = await fetch(`${GITHUB_APP_SERVICE_URL}/api/process-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl }),
    });

    if (!githubAppServiceResponse.ok) {
      const errorBody = await githubAppServiceResponse.text();
      fastify.log.error(`Error from GitHub App Service: ${githubAppServiceResponse.status} ${errorBody}`);
      return reply.status(githubAppServiceResponse.status).send({ error: 'Failed to initiate processing', details: errorBody });
    }

    const responseData = await githubAppServiceResponse.json();
    return reply.status(202).send(responseData); // 202 Accepted: request is accepted for processing

  } catch (error) {
    fastify.log.error(error, 'Error in /api/initiate-generation');
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});


const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`API Gateway listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();