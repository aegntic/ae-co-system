import { generateVideoAPI } from '../scripts/generate-real-video';

// Bun server endpoint for video generation
export default {
  async fetch(request: Request) {
    return generateVideoAPI(request);
  }
};