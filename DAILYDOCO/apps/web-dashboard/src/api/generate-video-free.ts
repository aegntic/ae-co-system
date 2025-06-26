import { generateFreeVideo } from '../scripts/generate-free-video';

// Bun server endpoint for free video generation
export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    try {
      const result = await generateFreeVideo();
      
      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Video generated for $0.00!',
          videoUrl: '/demo-video-free.mp4',
          metadata: result.metadata
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};