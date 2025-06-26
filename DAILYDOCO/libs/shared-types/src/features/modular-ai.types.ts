// Modular AI Architecture Types - Hot-swappable AI Models

export interface AIModelInterface {
  id: string;
  name: string;
  version: string;
  provider: string;
  capabilities: ModelCapabilities;
  requirements: ResourceRequirements;
  deployment: DeploymentConfig;
  specialization: string;
  
  // Core methods
  analyze(input: any, context?: AIContext): Promise<AIResponse>;
  getCapabilities(): ModelCapabilities;
  getRequirements(): ResourceRequirements;
  healthCheck(): Promise<HealthStatus>;
  shutdown(): Promise<void>;
}

export interface ModelCapabilities {
  taskTypes: AITaskType[];
  inputTypes: string[];
  outputTypes: string[];
  maxInputLength: number;
  maxOutputLength: number;
  multimodal: boolean;
  streaming: boolean;
  batchProcessing: boolean;
  fineTunable: boolean;
  languages: string[];
  specialties: string[];
}

export interface ResourceRequirements {
  minMemory: number; // bytes
  maxMemory: number; // bytes
  minCpu: number; // cores
  gpu: boolean;
  minGpuMemory?: number; // bytes
  storage: number; // bytes for model files
  network: boolean; // requires internet
  latency: LatencyClass;
  concurrent: number; // max concurrent requests
}

export enum LatencyClass {
  ULTRA_LOW = 'ultra_low',    // < 50ms
  LOW = 'low',                // < 100ms
  MEDIUM = 'medium',          // < 500ms
  HIGH = 'high',              // < 2000ms
  BATCH = 'batch'             // > 2000ms, optimized for throughput
}

export interface DeploymentConfig {
  environments: ('local' | 'edge' | 'cloud' | 'hybrid')[];
  scaling: ScalingConfig;
  fallback: FallbackConfig;
  security: SecurityConfig;
}

export interface ScalingConfig {
  minInstances: number;
  maxInstances: number;
  scaleMetric: 'cpu' | 'memory' | 'requests' | 'latency';
  scaleThreshold: number;
  cooldown: number; // seconds
}

export interface FallbackConfig {
  enabled: boolean;
  fallbackModels: string[];
  triggerConditions: FallbackTrigger[];
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
}

export enum FallbackTrigger {
  HIGH_LATENCY = 'high_latency',
  ERROR_RATE = 'error_rate',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  QUALITY_DEGRADATION = 'quality_degradation',
  COST_THRESHOLD = 'cost_threshold'
}

export interface SecurityConfig {
  encryption: boolean;
  dataResidency: string[];
  auditLogging: boolean;
  accessControl: AccessControlConfig;
}

export interface AccessControlConfig {
  authentication: boolean;
  authorization: boolean;
  rateLimiting: RateLimitConfig;
  ipWhitelisting: boolean;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  concurrentRequests: number;
  burstCapacity: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  metrics: HealthMetrics;
  issues: HealthIssue[];
}

export interface HealthMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  resourceUsage: ResourceUsage;
  accuracy: number;
}

export interface ResourceUsage {
  cpu: number; // percentage
  memory: number; // bytes
  gpu?: number; // percentage
  network: number; // bytes/second
}

export interface HealthIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  suggested_action: string;
}

// Specific Model Implementations

export interface DeepSeekR1Config extends AIModelInterface {
  model: 'deepseek-r1';
  reasoning: {
    chainOfThought: boolean;
    stepByStep: boolean;
    selfCorrection: boolean;
    multiPerspective: boolean;
  };
  optimization: {
    quantization: '4bit' | '8bit' | '16bit' | 'none';
    caching: boolean;
    prefillOptimization: boolean;
  };
}

export interface Gemma3Config extends AIModelInterface {
  model: 'gemma-3';
  efficiency: {
    edgeOptimized: boolean;
    lowLatency: boolean;
    minimalMemory: boolean;
    wasmCompatible: boolean;
  };
  deployment: {
    browserSupport: boolean;
    mobileSupport: boolean;
    offlineCapable: boolean;
  };
}

// Model Router and Selection

export interface ModelRouter {
  selectOptimalModel(task: AITask): Promise<string>;
  routeTask(task: AITask): Promise<AIResponse>;
  balanceLoad(tasks: AITask[]): Promise<TaskDistribution>;
  optimizeRouting(): Promise<RoutingStrategy>;
}

export interface TaskDistribution {
  assignments: Map<string, string[]>; // modelId -> taskIds
  loadBalance: Map<string, number>; // modelId -> load percentage
  expectedLatency: Map<string, number>; // taskId -> latency estimate
}

export interface RoutingStrategy {
  rules: RoutingRule[];
  optimization: OptimizationStrategy;
  fallbacks: FallbackStrategy[];
  monitoring: MonitoringConfig;
}

export interface RoutingRule {
  condition: RoutingCondition;
  action: RoutingAction;
  priority: number;
  active: boolean;
}

export interface RoutingCondition {
  taskType?: AITaskType[];
  complexity?: string[];
  latency?: string[];
  userTier?: string[];
  timeOfDay?: string[];
  resourceAvailability?: ResourceThreshold;
}

export interface ResourceThreshold {
  cpu?: number;
  memory?: number;
  gpu?: number;
  cost?: number;
}

export interface RoutingAction {
  targetModel: string;
  parameters?: Record<string, any>;
  preprocessing?: string[];
  postprocessing?: string[];
}

export enum OptimizationStrategy {
  COST = 'cost',
  LATENCY = 'latency',
  QUALITY = 'quality',
  BALANCED = 'balanced',
  USER_PREFERENCE = 'user_preference'
}

export interface FallbackStrategy {
  trigger: FallbackTrigger;
  alternativeModel: string;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  jitter: boolean;
  circuitBreaker: boolean;
}

export interface MonitoringConfig {
  metricsCollection: boolean;
  performanceTracking: boolean;
  costTracking: boolean;
  qualityAssurance: boolean;
  alerting: AlertConfig;
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: AlertThreshold[];
  channels: string[];
  cooldown: number;
}

export interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
}