// Core AI Integration Types

export interface AITask {
  id: string;
  type: AITaskType;
  input: any;
  context: AIContext;
  requirements: TaskRequirements;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeout: number; // milliseconds
  retries: number;
}

export enum AITaskType {
  CODE_ANALYSIS = 'code_analysis',
  NARRATION_GENERATION = 'narration_generation',
  ENGAGEMENT_PREDICTION = 'engagement_prediction',
  PERSONA_SIMULATION = 'persona_simulation',
  IMPORTANCE_SCORING = 'importance_scoring',
  CONTENT_SUMMARIZATION = 'content_summarization',
  TITLE_OPTIMIZATION = 'title_optimization',
  THUMBNAIL_ANALYSIS = 'thumbnail_analysis',
  AUTHENTICITY_VALIDATION = 'authenticity_validation',
  PERSONAL_BRAND_ANALYSIS = 'personal_brand_analysis',
  PRIVACY_CONTENT_DETECTION = 'privacy_content_detection'
}

export interface AIContext {
  projectContext: ProjectContext;
  userProfile: UserProfile;
  sessionHistory: SessionHistory;
  platformSettings: PlatformSettings;
  temporalContext: TemporalContext;
}

export interface TaskRequirements {
  complexity: 'simple' | 'moderate' | 'complex' | 'ultra_complex';
  reasoning: 'basic' | 'intermediate' | 'deep' | 'chain_of_thought';
  latency: 'relaxed' | 'normal' | 'fast' | 'critical';
  accuracy: number; // 0-1, minimum required accuracy
  deployment: 'local' | 'edge' | 'cloud' | 'hybrid';
  privacy: 'public' | 'sensitive' | 'confidential' | 'classified';
}

export interface SessionHistory {
  recentTasks: AITask[];
  performanceMetrics: ModelPerformanceMetrics[];
  userFeedback: UserFeedback[];
  learningPoints: LearningPoint[];
}

export interface PlatformSettings {
  preferredModel: string;
  fallbackChain: string[];
  costOptimization: boolean;
  qualityThreshold: number;
  experimentationLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface TemporalContext {
  timeOfDay: string;
  dayOfWeek: string;
  timezone: string;
  workingHours: boolean;
  sessionDuration: number;
  userActivity: 'active' | 'idle' | 'focused' | 'distracted';
}

export interface AIResponse {
  taskId: string;
  modelUsed: string;
  result: any;
  confidence: number;
  processingTime: number;
  tokens: TokenUsage;
  metadata: ResponseMetadata;
  alternatives?: AlternativeResponse[];
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number; // in USD
}

export interface ResponseMetadata {
  modelVersion: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  stopSequences: string[];
  reasoning?: string; // Chain of thought for complex tasks
  sourceAttribution?: string[];
}

export interface AlternativeResponse {
  result: any;
  confidence: number;
  approach: string;
  reasoning: string;
}

export interface ModelPerformanceMetrics {
  modelId: string;
  taskType: AITaskType;
  averageLatency: number;
  accuracy: number;
  cost: number;
  userSatisfaction: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
}

export interface UserFeedback {
  taskId: string;
  rating: number; // 1-5
  comment?: string;
  improvements?: string[];
  timestamp: Date;
}

export interface LearningPoint {
  pattern: string;
  effectiveness: number;
  context: string;
  timestamp: Date;
  verified: boolean;
}