import { generateIntroVideo2025 } from '../scripts/generate-intro-video-2025';

// Enhanced API endpoint for 2025 intro video generation
export default {
  async fetch(request: Request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    console.log('🚀 Starting DailyDoco Pro Intro Video Generation (2025 Edition)...');
    
    try {
      const result = await generateIntroVideo2025();
      
      if (result.success) {
        return new Response(JSON.stringify({
          success: true,
          message: `Professional intro video generated in ${result.processingTime}s for $0.00!`,
          videoUrl: '/dailydoco-intro-2025.mp4',
          metadata: result.metadata,
          processingTime: result.processingTime,
          features: [
            '🎯 AI Test Audience (100 synthetic viewers)',
            '🤖 aegnt-27 Authenticity (95%+ scores)',
            '⚡ Sub-2x Realtime Processing',
            '💰 Zero-cost Generation Pipeline',
            '🎬 Professional Quality Output'
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Intro video generation failed:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        fallback: {
          message: 'Using existing demo video as fallback',
          videoUrl: '/demo-video.mp4'
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};