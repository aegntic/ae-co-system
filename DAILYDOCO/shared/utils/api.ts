// API utilities for all frontend versions

import type { GenerateVideoRequest, GenerateVideoResponse, Analytics, VideoProject } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Video generation
  async generateVideo(data: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    return this.request<GenerateVideoResponse>('/generate-video', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get video project
  async getVideoProject(projectId: string): Promise<VideoProject> {
    return this.request<VideoProject>(`/projects/${projectId}`);
  }

  // List video projects
  async listVideoProjects(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ projects: VideoProject[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/projects${query ? `?${query}` : ''}`);
  }

  // Get user analytics
  async getUserAnalytics(userId: string): Promise<Analytics> {
    return this.request<Analytics>(`/analytics/user/${userId}`);
  }

  // Upload video chunk (for large files)
  async uploadVideoChunk(
    projectId: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number
  ): Promise<{ uploaded: boolean; progress: number }> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    return this.request(`/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Export video
  async exportVideo(
    projectId: string,
    format: 'mp4' | 'webm' | 'gif',
    quality: 'standard' | 'high' | '4k'
  ): Promise<{ downloadUrl: string }> {
    return this.request(`/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format, quality }),
    });
  }
}

export const api = new ApiClient();

// Mock data for development
export const mockData = {
  analytics: {
    videosCreated: 127,
    storageUsedGB: 45.2,
    teamMembers: 8,
    savedHours: 312,
    authenticityScore: 97.3,
    monthlyViews: 15420,
    avgVideoDuration: 4.7,
  },
  liveMetrics: {
    docsCreatedToday: 342,
    activeUsers: 1247,
    processingQueue: 18,
    timestamp: Date.now(),
  },
  projects: [
    {
      id: '1',
      title: 'API Integration Tutorial',
      description: 'Complete walkthrough of our REST API integration',
      duration: 420,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'ready' as const,
      size: 52428800,
      views: 234,
      userId: 'user1',
      tags: ['api', 'tutorial', 'integration'],
      voiceStyle: 'professional' as const,
      quality: 'high' as const,
      thumbnail: 'https://via.placeholder.com/640x360',
    },
    {
      id: '2',
      title: 'Database Migration Guide',
      description: 'Step-by-step PostgreSQL to MongoDB migration',
      duration: 600,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'processing' as const,
      size: 0,
      views: 0,
      userId: 'user1',
      tags: ['database', 'migration', 'mongodb'],
      voiceStyle: 'technical' as const,
      quality: '4k' as const,
      thumbnail: 'https://via.placeholder.com/640x360',
    },
  ],
};