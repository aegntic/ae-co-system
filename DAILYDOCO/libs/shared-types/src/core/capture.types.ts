// Screen Capture and Recording Types

export interface CaptureConfig {
  quality: CaptureQuality;
  fps: number;
  monitors: MonitorConfig[];
  audio: AudioConfig;
  privacy: PrivacyConfig;
  storage: StorageConfig;
  performance: PerformanceConfig;
}

export enum CaptureQuality {
  LOW = '720p',
  MEDIUM = '1080p',
  HIGH = '1440p',
  ULTRA = '4K'
}

export interface MonitorConfig {
  id: string;
  name: string;
  resolution: Resolution;
  scale: number;
  primary: boolean;
  enabled: boolean;
  region?: CaptureRegion;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface CaptureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AudioConfig {
  enabled: boolean;
  source: AudioSource;
  quality: AudioQuality;
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

export enum AudioSource {
  SYSTEM = 'system',
  MICROPHONE = 'microphone',
  BOTH = 'both',
  NONE = 'none'
}

export enum AudioQuality {
  LOW = 'low',    // 64kbps
  MEDIUM = 'medium', // 128kbps
  HIGH = 'high',  // 256kbps
  LOSSLESS = 'lossless' // 1411kbps
}

export interface PrivacyConfig {
  sensitiveContentDetection: boolean;
  blurSensitiveContent: boolean;
  excludePatterns: string[];
  includePatterns: string[];
  personalDataFilter: boolean;
  apiKeyDetection: boolean;
  passwordDetection: boolean;
  emailDetection: boolean;
  phoneDetection: boolean;
}

export interface StorageConfig {
  location: string;
  maxSize: number; // bytes
  compression: CompressionConfig;
  encryption: EncryptionConfig;
  retention: RetentionConfig;
}

export interface CompressionConfig {
  algorithm: 'h264' | 'h265' | 'vp9' | 'av1';
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  quality: number; // 0-51, lower is better
  targetBitrate?: number;
}

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305';
  keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
}

export interface RetentionConfig {
  maxAge: number; // days
  maxFiles: number;
  autoCleanup: boolean;
}

export interface PerformanceConfig {
  maxCpuUsage: number; // percentage
  maxMemoryUsage: number; // bytes
  gpuAcceleration: boolean;
  hardwareEncoder: boolean;
  adaptiveQuality: boolean;
  bufferSize: number; // frames
}

export interface CaptureSession {
  id: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  config: CaptureConfig;
  status: CaptureStatus;
  frames: CapturedFrame[];
  metadata: SessionMetadata;
  statistics: CaptureStatistics;
}

export enum CaptureStatus {
  INITIALIZING = 'initializing',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CapturedFrame {
  timestamp: number;
  data: ArrayBuffer;
  metadata: FrameMetadata;
  importance: number; // 0-1 ML-generated score
}

export interface FrameMetadata {
  resolution: Resolution;
  format: string;
  size: number; // bytes
  hasAudio: boolean;
  mousePosition?: Point;
  keyboardActivity?: boolean;
  windowTitle?: string;
  activeApplication?: string;
  contentHash?: string; // for deduplication
}

export interface Point {
  x: number;
  y: number;
}

export interface SessionMetadata {
  capturedEvents: ActivityEvent[];
  environmentInfo: EnvironmentInfo;
  performanceMetrics: PerformanceMetrics;
  privacyActions: PrivacyAction[];
}

export interface EnvironmentInfo {
  os: string;
  version: string;
  architecture: string;
  totalMemory: number;
  availableMemory: number;
  cpuCores: number;
  gpuInfo?: GpuInfo;
}

export interface GpuInfo {
  vendor: string;
  model: string;
  memory: number;
  driverVersion: string;
}

export interface PerformanceMetrics {
  averageCpuUsage: number;
  peakCpuUsage: number;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  framesDropped: number;
  encodingLatency: number;
  storageIOps: number;
}

export interface PrivacyAction {
  timestamp: Date;
  type: 'blur' | 'redact' | 'exclude';
  region: CaptureRegion;
  reason: string;
  confidence: number;
}

export interface CaptureStatistics {
  totalFrames: number;
  totalSize: number; // bytes
  compressionRatio: number;
  averageFps: number;
  qualityScore: number; // 0-1
  processingTime: number; // milliseconds
}