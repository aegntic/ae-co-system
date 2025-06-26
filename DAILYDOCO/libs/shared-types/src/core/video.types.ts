// Video Processing and Production Types

export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  projectFingerprint: ProjectFingerprint;
  captureSession: CaptureSession;
  configuration: VideoConfiguration;
  timeline: VideoTimeline;
  status: VideoProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata: VideoProjectMetadata;
}

export enum VideoProjectStatus {
  INITIALIZING = 'initializing',
  CAPTURING = 'capturing',
  PROCESSING = 'processing',
  ANALYZING = 'analyzing',
  OPTIMIZING = 'optimizing',
  READY_FOR_REVIEW = 'ready_for_review',
  APPROVED = 'approved',
  EXPORTING = 'exporting',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface VideoConfiguration {
  template: VideoTemplate;
  style: VideoStyle;
  output: OutputConfiguration;
  ai: AIConfiguration;
  branding: BrandingConfiguration;
  accessibility: AccessibilityConfiguration;
}

export interface VideoTemplate {
  id: string;
  name: string;
  type: VideoTemplateType;
  duration: DurationConstraint;
  structure: VideoStructure;
  style: TemplateStyle;
}

export enum VideoTemplateType {
  QUICK_DEMO = 'quick_demo',           // 1-3 minutes
  TUTORIAL = 'tutorial',               // 10-30 minutes
  DEEP_DIVE = 'deep_dive',            // 30+ minutes
  BUG_FIX = 'bug_fix',                // 3-10 minutes
  CODE_REVIEW = 'code_review',         // 5-15 minutes
  ARCHITECTURE_OVERVIEW = 'architecture_overview', // 15-45 minutes
  LIVE_CODING = 'live_coding',         // Variable
  PRESENTATION = 'presentation'        // Variable
}

export interface DurationConstraint {
  min: number; // seconds
  max: number; // seconds
  target: number; // seconds
  flexible: boolean;
}

export interface VideoStructure {
  intro: IntroSection;
  body: BodySection[];
  conclusion: ConclusionSection;
  transitions: TransitionConfig;
}

export interface IntroSection {
  duration: number; // seconds
  elements: IntroElement[];
  style: 'animated' | 'static' | 'voice_only' | 'custom';
}

export interface IntroElement {
  type: 'logo' | 'title' | 'subtitle' | 'hook' | 'overview';
  content: string;
  timing: number; // seconds from start
  duration: number; // seconds
  animation?: AnimationConfig;
}

export interface BodySection {
  id: string;
  title: string;
  type: BodySectionType;
  duration: number; // seconds
  importance: number; // 0-1
  content: ContentElement[];
  narration?: NarrationConfig;
}

export enum BodySectionType {
  CODE_EXPLANATION = 'code_explanation',
  DEMONSTRATION = 'demonstration',
  PROBLEM_SOLVING = 'problem_solving',
  SETUP = 'setup',
  TESTING = 'testing',
  DEBUGGING = 'debugging',
  DEPLOYMENT = 'deployment',
  REVIEW = 'review'
}

export interface ContentElement {
  id: string;
  type: ContentElementType;
  timestamp: number; // seconds
  duration: number; // seconds
  source: ContentSource;
  metadata: ContentMetadata;
  processing: ProcessingConfig;
}

export enum ContentElementType {
  SCREEN_CAPTURE = 'screen_capture',
  AUDIO_NARRATION = 'audio_narration',
  TEXT_OVERLAY = 'text_overlay',
  CODE_HIGHLIGHT = 'code_highlight',
  ANIMATION = 'animation',
  TRANSITION = 'transition',
  CALL_TO_ACTION = 'call_to_action',
  B_ROLL = 'b_roll'
}

export interface ContentSource {
  type: 'capture' | 'generated' | 'template' | 'external';
  location: string;
  format: string;
  quality: QualityMetrics;
}

export interface QualityMetrics {
  resolution: Resolution;
  bitrate: number;
  fps: number;
  audioQuality: AudioQuality;
  compressionRatio: number;
}

export interface ContentMetadata {
  importance: number; // 0-1
  engagement: number; // 0-1 predicted
  difficulty: number; // 0-1
  tags: string[];
  topics: string[];
  codeLanguages: string[];
  tools: string[];
}

export interface ProcessingConfig {
  stabilization: boolean;
  noiseReduction: boolean;
  colorCorrection: boolean;
  enhancement: EnhancementConfig;
  compression: CompressionConfig;
}

export interface EnhancementConfig {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number; // -100 to 100
  autoCorrect: boolean;
}

export interface ConclusionSection {
  duration: number; // seconds
  elements: ConclusionElement[];
  callToAction: CallToActionConfig[];
}

export interface ConclusionElement {
  type: 'summary' | 'next_steps' | 'resources' | 'thanks' | 'subscribe';
  content: string;
  timing: number; // seconds
  emphasis: 'low' | 'medium' | 'high';
}

export interface CallToActionConfig {
  type: 'subscribe' | 'like' | 'comment' | 'share' | 'follow' | 'visit';
  timing: number; // seconds
  duration: number; // seconds
  style: CTAStyle;
  content: string;
  placement: 'overlay' | 'narration' | 'both';
}

export interface CTAStyle {
  visual: boolean;
  animated: boolean;
  prominent: boolean;
  color: string;
  position: 'top' | 'center' | 'bottom' | 'corner';
}

export interface TransitionConfig {
  style: TransitionStyle;
  duration: number; // milliseconds
  easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
  effects: TransitionEffect[];
}

export enum TransitionStyle {
  CUT = 'cut',
  FADE = 'fade',
  SLIDE = 'slide',
  ZOOM = 'zoom',
  WIPE = 'wipe',
  CUSTOM = 'custom'
}

export interface TransitionEffect {
  type: string;
  parameters: Record<string, any>;
  timing: number; // milliseconds
}

export interface VideoStyle {
  theme: VideoTheme;
  colorPalette: ColorPalette;
  typography: Typography;
  animations: AnimationStyle;
  effects: EffectConfig;
}

export interface VideoTheme {
  name: string;
  mood: 'professional' | 'casual' | 'energetic' | 'calm' | 'dark' | 'light';
  target: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  platform: 'youtube' | 'linkedin' | 'internal' | 'universal';
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  highlight: string;
  error: string;
  success: string;
}

export interface Typography {
  title: FontConfig;
  subtitle: FontConfig;
  body: FontConfig;
  code: FontConfig;
  caption: FontConfig;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: number;
  color: string;
  lineHeight: number;
  letterSpacing: number;
}

export interface AnimationStyle {
  entrance: AnimationConfig;
  emphasis: AnimationConfig;
  exit: AnimationConfig;
  transitions: AnimationConfig;
}

export interface AnimationConfig {
  type: string;
  duration: number; // milliseconds
  delay: number; // milliseconds
  easing: string;
  parameters: Record<string, any>;
}

export interface EffectConfig {
  blur: boolean;
  glow: boolean;
  shadow: boolean;
  borders: boolean;
  gradients: boolean;
  particles: boolean;
}

export interface OutputConfiguration {
  formats: OutputFormat[];
  quality: QualityPreset;
  optimization: OptimizationConfig;
  delivery: DeliveryConfig;
}

export interface OutputFormat {
  type: 'mp4' | 'mov' | 'webm' | 'avi' | 'gif';
  codec: string;
  resolution: Resolution;
  fps: number;
  bitrate: number;
  audioCodec: string;
  audioBitrate: number;
}

export enum QualityPreset {
  DRAFT = 'draft',           // Fast processing, lower quality
  STANDARD = 'standard',     // Balanced quality/speed
  HIGH = 'high',            // High quality, slower processing
  BROADCAST = 'broadcast',   // Maximum quality
  WEB = 'web',              // Optimized for web delivery
  MOBILE = 'mobile'         // Optimized for mobile devices
}

export interface OptimizationConfig {
  targetPlatform: string[];
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  preserveQuality: boolean;
  targetFileSize?: number; // bytes
  adaptiveBitrate: boolean;
  multiPass: boolean;
}

export interface DeliveryConfig {
  destinations: DeliveryDestination[];
  scheduling: SchedulingConfig;
  privacy: PrivacyConfig;
  metadata: DeliveryMetadata;
}

export interface DeliveryDestination {
  platform: string;
  configuration: PlatformConfig;
  optimization: PlatformOptimization;
  credentials: string; // encrypted reference
}

export interface PlatformConfig {
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  category: string;
  privacy: 'public' | 'unlisted' | 'private';
  monetization: boolean;
}

export interface PlatformOptimization {
  titleOptimization: boolean;
  descriptionOptimization: boolean;
  thumbnailOptimization: boolean;
  tagOptimization: boolean;
  timingOptimization: boolean;
}

export interface SchedulingConfig {
  publishAt?: Date;
  timezone: string;
  recurringSchedule?: RecurringSchedule;
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  time: string; // HH:mm format
}

export interface DeliveryMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  subtitles: SubtitleConfig[];
  chapters: ChapterConfig[];
}

export interface SubtitleConfig {
  language: string;
  auto: boolean;
  source?: string; // file path or URL
  format: 'srt' | 'vtt' | 'ass';
}

export interface ChapterConfig {
  title: string;
  startTime: number; // seconds
  endTime: number; // seconds
  description?: string;
}

export interface AIConfiguration {
  narration: NarrationConfig;
  optimization: AIOptimizationConfig;
  quality: AIQualityConfig;
  personalization: PersonalizationConfig;
}

export interface NarrationConfig {
  enabled: boolean;
  voice: VoiceConfig;
  style: NarrationStyle;
  language: string;
  speed: number; // 0.5 to 2.0
  volume: number; // 0 to 100
  quality: 'draft' | 'standard' | 'high' | 'broadcast';
}

export interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'mature';
  accent: string;
  characteristics: string[];
}

export interface NarrationStyle {
  tone: 'conversational' | 'professional' | 'educational' | 'entertaining';
  pace: 'slow' | 'normal' | 'fast' | 'variable';
  emphasis: 'minimal' | 'moderate' | 'dynamic';
  pauses: 'natural' | 'structured' | 'minimal';
}

export interface AIOptimizationConfig {
  engagement: boolean;
  retention: boolean;
  accessibility: boolean;
  platform: boolean;
  personal: boolean;
}

export interface AIQualityConfig {
  accuracy: number; // 0-1 minimum accuracy threshold
  factChecking: boolean;
  consistency: boolean;
  relevance: boolean;
  clarity: boolean;
}

export interface PersonalizationConfig {
  userProfile: boolean;
  audienceOptimization: boolean;
  brandAlignment: boolean;
  contentAdaptation: boolean;
  learningIncorporation: boolean;
}

export interface BrandingConfiguration {
  logo: LogoConfig;
  colors: ColorPalette;
  fonts: Typography;
  watermark: WatermarkConfig;
  intro: BrandedIntroConfig;
  outro: BrandedOutroConfig;
}

export interface LogoConfig {
  enabled: boolean;
  source: string;
  placement: 'corner' | 'center' | 'custom';
  size: number; // percentage of screen
  opacity: number; // 0-1
  timing: 'always' | 'intro_outro' | 'intro_only' | 'outro_only';
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  opacity: number; // 0-1
  size: number;
  font: string;
}

export interface BrandedIntroConfig {
  enabled: boolean;
  template: string;
  duration: number; // seconds
  customization: IntroCustomization;
}

export interface IntroCustomization {
  title: string;
  subtitle: string;
  animation: string;
  music: string;
  voiceover: boolean;
}

export interface BrandedOutroConfig {
  enabled: boolean;
  template: string;
  duration: number; // seconds
  elements: OutroElement[];
}

export interface OutroElement {
  type: 'subscribe' | 'related_videos' | 'social_links' | 'contact';
  content: string;
  style: any;
}

export interface AccessibilityConfiguration {
  subtitles: SubtitleAccessibilityConfig;
  audio: AudioAccessibilityConfig;
  visual: VisualAccessibilityConfig;
  navigation: NavigationAccessibilityConfig;
}

export interface SubtitleAccessibilityConfig {
  enabled: boolean;
  languages: string[];
  styling: SubtitleStyling;
  positioning: SubtitlePositioning;
}

export interface SubtitleStyling {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  shadow: boolean;
}

export interface SubtitlePositioning {
  position: 'bottom' | 'top' | 'center';
  margin: number; // percentage
  alignment: 'left' | 'center' | 'right';
}

export interface AudioAccessibilityConfig {
  descriptions: boolean;
  enhancedAudio: boolean;
  volumeNormalization: boolean;
  frequencyAdjustment: boolean;
}

export interface VisualAccessibilityConfig {
  highContrast: boolean;
  largeText: boolean;
  colorBlindFriendly: boolean;
  reducedMotion: boolean;
}

export interface NavigationAccessibilityConfig {
  keyboardNavigation: boolean;
  screenReader: boolean;
  chapters: boolean;
  jumpToContent: boolean;
}

export interface VideoTimeline {
  duration: number; // seconds
  segments: TimelineSegment[];
  markers: TimelineMarker[];
  tracks: Track[];
}

export interface TimelineSegment {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  type: SegmentType;
  importance: number; // 0-1
  content: ContentElement[];
  processing: SegmentProcessing;
}

export enum SegmentType {
  INTRODUCTION = 'introduction',
  MAIN_CONTENT = 'main_content',
  DEMONSTRATION = 'demonstration',
  EXPLANATION = 'explanation',
  TRANSITION = 'transition',
  CONCLUSION = 'conclusion',
  CALL_TO_ACTION = 'call_to_action'
}

export interface SegmentProcessing {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-1
  estimatedCompletion?: Date;
  errors: ProcessingError[];
}

export interface ProcessingError {
  code: string;
  message: string;
  timestamp: Date;
  severity: 'warning' | 'error' | 'critical';
  resolution?: string;
}

export interface TimelineMarker {
  id: string;
  timestamp: number; // seconds
  type: MarkerType;
  label: string;
  metadata: Record<string, any>;
}

export enum MarkerType {
  CHAPTER = 'chapter',
  HIGHLIGHT = 'highlight',
  EDIT_POINT = 'edit_point',
  QUALITY_ISSUE = 'quality_issue',
  OPTIMIZATION = 'optimization',
  USER_ANNOTATION = 'user_annotation'
}

export interface Track {
  id: string;
  type: TrackType;
  enabled: boolean;
  muted: boolean;
  volume: number; // 0-1
  elements: TrackElement[];
}

export enum TrackType {
  VIDEO = 'video',
  AUDIO_NARRATION = 'audio_narration',
  AUDIO_BACKGROUND = 'audio_background',
  SUBTITLES = 'subtitles',
  OVERLAY = 'overlay',
  EFFECTS = 'effects'
}

export interface TrackElement {
  id: string;
  startTime: number; // seconds
  duration: number; // seconds
  source: ContentSource;
  effects: Effect[];
  properties: Record<string, any>;
}

export interface Effect {
  id: string;
  type: string;
  parameters: Record<string, any>;
  enabled: boolean;
  intensity: number; // 0-1
}

export interface VideoProjectMetadata {
  creator: string;
  version: number;
  tags: string[];
  description: string;
  estimatedDuration: number; // seconds
  targetAudience: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  technologies: string[];
  learningObjectives: string[];
}

// Processing and Compilation Types

export interface VideoProcessingPipeline {
  id: string;
  project: VideoProject;
  stages: ProcessingStage[];
  status: PipelineStatus;
  progress: PipelineProgress;
  performance: PipelinePerformance;
}

export enum PipelineStatus {
  QUEUED = 'queued',
  INITIALIZING = 'initializing',
  PROCESSING = 'processing',
  OPTIMIZING = 'optimizing',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProcessingStage {
  id: string;
  name: string;
  type: StageType;
  status: StageStatus;
  progress: number; // 0-1
  dependencies: string[];
  estimatedDuration: number; // seconds
  actualDuration?: number; // seconds
  resources: ResourceUsage;
}

export enum StageType {
  ANALYSIS = 'analysis',
  PREPROCESSING = 'preprocessing',
  AI_PROCESSING = 'ai_processing',
  VIDEO_ENCODING = 'video_encoding',
  AUDIO_PROCESSING = 'audio_processing',
  OPTIMIZATION = 'optimization',
  QUALITY_CHECK = 'quality_check',
  EXPORT = 'export'
}

export enum StageStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

export interface PipelineProgress {
  overall: number; // 0-1
  currentStage: string;
  completedStages: number;
  totalStages: number;
  estimatedTimeRemaining: number; // seconds
  speed: number; // x realtime
}

export interface PipelinePerformance {
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // seconds
  cpuUsage: number[]; // percentage over time
  memoryUsage: number[]; // bytes over time
  gpuUsage?: number[]; // percentage over time
  throughput: number; // frames per second
  efficiency: number; // 0-1
}