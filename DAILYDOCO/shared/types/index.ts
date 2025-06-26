// Shared types for all DailyDoco Pro frontend versions

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
  teamId?: string;
}

export interface VideoProject {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'processing' | 'ready' | 'published';
  size: number; // in bytes
  views: number;
  userId: string;
  tags: string[];
  voiceStyle: 'professional' | 'casual' | 'technical';
  quality: 'standard' | 'high' | '4k';
}

export interface Analytics {
  videosCreated: number;
  storageUsedGB: number;
  teamMembers: number;
  savedHours: number;
  authenticityScore: number;
  monthlyViews: number;
  avgVideoDuration: number;
}

export interface LiveMetrics {
  docsCreatedToday: number;
  activeUsers: number;
  processingQueue: number;
  timestamp: number;
}

export interface GenerateVideoRequest {
  title: string;
  description: string;
  duration?: number;
  voiceStyle?: 'professional' | 'casual' | 'technical';
  quality?: 'standard' | 'high' | '4k';
  privacy?: {
    blurSensitive: boolean;
    excludePatterns: string[];
  };
}

export interface GenerateVideoResponse {
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
  progress?: number;
  error?: string;
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      '6xl': string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  animation: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: number;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}