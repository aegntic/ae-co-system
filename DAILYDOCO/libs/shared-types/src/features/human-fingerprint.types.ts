// aegnt-27: The Human Peak Protocol - Human Authenticity Engine Types
// Where AI Achieves Peak Human Authenticity - 95%+ Authenticity Score

export interface HumanFingerprintConfig {
  enabled: boolean;
  intensity: AuthenticityIntensity;
  components: FingerprintComponent[];
  validation: ValidationConfig;
  antiDetection: AntiDetectionConfig;
}

export enum AuthenticityIntensity {
  MINIMAL = 'minimal',     // 85-90% authenticity
  MODERATE = 'moderate',   // 90-95% authenticity
  HIGH = 'high',          // 95-97% authenticity
  MAXIMUM = 'maximum'     // 97%+ authenticity
}

export interface FingerprintComponent {
  type: ComponentType;
  enabled: boolean;
  configuration: ComponentConfig;
  weight: number; // 0-1, importance in overall authenticity
}

export enum ComponentType {
  SPEECH_PATTERNS = 'speech_patterns',
  MOUSE_BEHAVIOR = 'mouse_behavior',
  TYPING_PATTERNS = 'typing_patterns',
  BREATHING_SIMULATION = 'breathing_simulation',
  ERROR_INJECTION = 'error_injection',
  PAUSE_GENERATION = 'pause_generation',
  EMOTIONAL_VARIATION = 'emotional_variation',
  VISUAL_ARTIFACTS = 'visual_artifacts',
  AUDIO_ARTIFACTS = 'audio_artifacts',
  BEHAVIORAL_INCONSISTENCY = 'behavioral_inconsistency'
}

export interface ComponentConfig {
  [key: string]: any;
  frequency?: number;
  intensity?: number;
  variability?: number;
  patterns?: string[];
}

export interface ValidationConfig {
  detectors: DetectorConfig[];
  threshold: number; // 0-1, minimum authenticity score
  continuous: boolean;
  feedback: boolean;
}

export interface DetectorConfig {
  name: string;
  type: DetectorType;
  enabled: boolean;
  weight: number; // 0-1, importance in validation
  configuration: Record<string, any>;
}

export enum DetectorType {
  AI_DETECTOR = 'ai_detector',         // GPTZero, Originality.ai
  SPEECH_ANALYSIS = 'speech_analysis', // Voice authenticity
  BEHAVIORAL_ANALYSIS = 'behavioral_analysis', // Mouse/keyboard patterns
  STATISTICAL_ANALYSIS = 'statistical_analysis', // Pattern recognition
  PLATFORM_DETECTOR = 'platform_detector', // YouTube, LinkedIn detection
  CUSTOM_DETECTOR = 'custom_detector'
}

export interface AntiDetectionConfig {
  techniques: AntiDetectionTechnique[];
  adaptive: boolean;
  countermeasures: CountermeasureConfig[];
  monitoring: DetectionMonitoringConfig;
}

export interface AntiDetectionTechnique {
  type: TechniqueType;
  enabled: boolean;
  intensity: number; // 0-1
  configuration: TechniqueConfig;
}

export enum TechniqueType {
  NOISE_INJECTION = 'noise_injection',
  PATTERN_VARIATION = 'pattern_variation',
  TIMING_RANDOMIZATION = 'timing_randomization',
  FINGERPRINT_SPOOFING = 'fingerprint_spoofing',
  METADATA_OBFUSCATION = 'metadata_obfuscation',
  ENCODING_VARIATION = 'encoding_variation'
}

export interface TechniqueConfig {
  parameters: Record<string, any>;
  frequency: number; // 0-1
  strength: number; // 0-1
  adaptive: boolean;
}

export interface CountermeasureConfig {
  detector: string;
  countermeasures: string[];
  effectiveness: number; // 0-1
  updated: Date;
}

export interface DetectionMonitoringConfig {
  enabled: boolean;
  frequency: MonitoringFrequency;
  alerts: boolean;
  learning: boolean;
}

export enum MonitoringFrequency {
  REALTIME = 'realtime',
  CONTINUOUS = 'continuous',
  PERIODIC = 'periodic',
  ON_DEMAND = 'on_demand'
}

// Speech Pattern Components

export interface SpeechPatternConfig extends ComponentConfig {
  naturalPauses: PauseConfig;
  breathingPatterns: BreathingConfig;
  fillerWords: FillerWordConfig;
  emotionalVariation: EmotionalConfig;
  pacingVariation: PacingConfig;
  pronunciation: PronunciationConfig;
}

export interface PauseConfig {
  enabled: boolean;
  types: PauseType[];
  frequency: number; // pauses per minute
  duration: PauseDurationConfig;
  placement: PausePlacementConfig;
}

export enum PauseType {
  THINKING = 'thinking',
  BREATHING = 'breathing',
  EMPHASIS = 'emphasis',
  TRANSITION = 'transition',
  HESITATION = 'hesitation',
  NATURAL = 'natural'
}

export interface PauseDurationConfig {
  min: number; // milliseconds
  max: number; // milliseconds
  average: number; // milliseconds
  distribution: 'normal' | 'exponential' | 'uniform';
}

export interface PausePlacementConfig {
  beforeWords: string[];
  afterWords: string[];
  sentenceBreaks: boolean;
  paragraphBreaks: boolean;
  codeBlocks: boolean;
}

export interface BreathingConfig {
  enabled: boolean;
  pattern: BreathingPattern;
  frequency: number; // breaths per minute
  audibility: number; // 0-1
  variation: number; // 0-1
}

export interface BreathingPattern {
  inhale: number; // milliseconds
  hold: number; // milliseconds
  exhale: number; // milliseconds
  pause: number; // milliseconds
}

export interface FillerWordConfig {
  enabled: boolean;
  words: FillerWord[];
  frequency: number; // fillers per minute
  placement: FillerPlacement;
}

export interface FillerWord {
  word: string;
  probability: number; // 0-1
  context: string[];
  emotion: EmotionContext[];
}

export enum EmotionContext {
  NEUTRAL = 'neutral',
  THINKING = 'thinking',
  UNCERTAIN = 'uncertain',
  CONFIDENT = 'confident',
  EXCITED = 'excited',
  FRUSTRATED = 'frustrated'
}

export interface FillerPlacement {
  beforeSentences: boolean;
  afterQuestions: boolean;
  duringThinking: boolean;
  beforeComplexConcepts: boolean;
  randomInsertion: number; // 0-1 probability
}

export interface EmotionalConfig {
  enabled: boolean;
  baseEmotion: EmotionContext;
  variationRange: number; // 0-1
  triggers: EmotionalTrigger[];
  recovery: EmotionalRecovery;
}

export interface EmotionalTrigger {
  context: string;
  emotion: EmotionContext;
  intensity: number; // 0-1
  duration: number; // seconds
  fadeOut: number; // seconds
}

export interface EmotionalRecovery {
  enabled: boolean;
  speed: number; // 0-1, how quickly to return to baseline
  overshoot: boolean; // slight overcorrection for realism
}

export interface PacingConfig {
  enabled: boolean;
  baseSpeed: number; // words per minute
  variation: PacingVariation;
  contextual: ContextualPacing[];
}

export interface PacingVariation {
  range: number; // percentage variation from base
  frequency: number; // changes per minute
  smoothing: number; // 0-1, gradual vs abrupt changes
}

export interface ContextualPacing {
  context: PacingContext;
  speedMultiplier: number; // relative to base speed
  confidence: number; // 0-1
}

export enum PacingContext {
  CODE_EXPLANATION = 'code_explanation',
  COMPLEX_CONCEPT = 'complex_concept',
  SIMPLE_CONCEPT = 'simple_concept',
  EXAMPLE = 'example',
  SUMMARY = 'summary',
  INTRODUCTION = 'introduction',
  CONCLUSION = 'conclusion'
}

export interface PronunciationConfig {
  enabled: boolean;
  technicalTerms: TechnicalPronunciation[];
  regionalVariations: RegionalVariation[];
  learningCurve: LearningCurveConfig;
}

export interface TechnicalPronunciation {
  term: string;
  pronunciation: string;
  confidence: number; // 0-1, how certain the speaker is
  alternatives: string[]; // occasional mispronunciations
}

export interface RegionalVariation {
  region: string;
  variations: Map<string, string>;
  intensity: number; // 0-1
}

export interface LearningCurveConfig {
  enabled: boolean;
  improvementRate: number; // how quickly pronunciation improves
  initialConfidence: number; // 0-1
  plateauConfidence: number; // 0-1
}

// Mouse Behavior Components

export interface MouseBehaviorConfig extends ComponentConfig {
  movement: MouseMovementConfig;
  clicking: ClickingConfig;
  scrolling: ScrollingConfig;
  gestures: GestureConfig;
}

export interface MouseMovementConfig {
  enabled: boolean;
  microMovements: MicroMovementConfig;
  trajectories: TrajectoryConfig;
  acceleration: AccelerationConfig;
  drift: DriftConfig;
}

export interface MicroMovementConfig {
  enabled: boolean;
  frequency: number; // movements per second
  amplitude: AmplitudeConfig;
  patterns: MovementPattern[];
}

export interface AmplitudeConfig {
  min: number; // pixels
  max: number; // pixels
  distribution: 'normal' | 'exponential' | 'uniform';
}

export interface MovementPattern {
  type: PatternType;
  probability: number; // 0-1
  parameters: Record<string, number>;
}

export enum PatternType {
  RANDOM_WALK = 'random_walk',
  CIRCULAR = 'circular',
  TREMOR = 'tremor',
  DRIFT = 'drift',
  CORRECTION = 'correction'
}

export interface TrajectoryConfig {
  enabled: boolean;
  overshoot: OvershootConfig;
  correction: CorrectionConfig;
  bezierCurves: boolean;
}

export interface OvershootConfig {
  enabled: boolean;
  probability: number; // 0-1
  distance: DistanceRange;
  correctionDelay: TimeRange;
}

export interface DistanceRange {
  min: number; // pixels
  max: number; // pixels
}

export interface TimeRange {
  min: number; // milliseconds
  max: number; // milliseconds
}

export interface CorrectionConfig {
  enabled: boolean;
  steps: number; // correction attempts
  accuracy: number; // 0-1, final accuracy
  hesitation: boolean;
}

export interface AccelerationConfig {
  enabled: boolean;
  profiles: AccelerationProfile[];
  humanLike: boolean;
  variability: number; // 0-1
}

export interface AccelerationProfile {
  name: string;
  curve: AccelerationCurve;
  parameters: AccelerationParameters;
}

export interface AccelerationCurve {
  type: 'linear' | 'exponential' | 'sigmoid' | 'custom';
  points: AccelerationPoint[];
}

export interface AccelerationPoint {
  time: number; // 0-1, normalized time
  velocity: number; // 0-1, normalized velocity
}

export interface AccelerationParameters {
  startSpeed: number; // pixels per second
  maxSpeed: number; // pixels per second
  acceleration: number; // pixels per second^2
  deceleration: number; // pixels per second^2
}

export interface DriftConfig {
  enabled: boolean;
  velocity: DriftVelocity;
  direction: DriftDirection;
  correction: DriftCorrection;
}

export interface DriftVelocity {
  min: number; // pixels per second
  max: number; // pixels per second
  variation: number; // 0-1
}

export interface DriftDirection {
  bias: DirectionBias;
  randomness: number; // 0-1
  changeFrequency: number; // changes per minute
}

export interface DirectionBias {
  x: number; // -1 to 1
  y: number; // -1 to 1
  strength: number; // 0-1
}

export interface DriftCorrection {
  enabled: boolean;
  threshold: number; // pixels from intended position
  speed: number; // correction speed multiplier
  smoothness: number; // 0-1
}

export interface ClickingConfig {
  enabled: boolean;
  timing: ClickTimingConfig;
  pressure: ClickPressureConfig;
  doubleClick: DoubleClickConfig;
  misclicks: MisclickConfig;
}

export interface ClickTimingConfig {
  preDelay: TimeRange;
  postDelay: TimeRange;
  holdDuration: TimeRange;
  variability: number; // 0-1
}

export interface ClickPressureConfig {
  enabled: boolean;
  variation: number; // 0-1
  buildup: boolean; // gradual pressure increase
  release: boolean; // gradual pressure release
}

export interface DoubleClickConfig {
  enabled: boolean;
  interval: TimeRange;
  accuracy: number; // 0-1, position accuracy
  consistency: number; // 0-1, timing consistency
}

export interface MisclickConfig {
  enabled: boolean;
  probability: number; // 0-1
  correction: MisclickCorrection;
  types: MisclickType[];
}

export interface MisclickCorrection {
  enabled: boolean;
  delay: TimeRange;
  attempts: number;
  accuracy: number; // 0-1
}

export enum MisclickType {
  OVERSHOOT = 'overshoot',
  UNDERSHOOT = 'undershoot',
  SIDE_SLIP = 'side_slip',
  DOUBLE_CLICK = 'double_click'
}

export interface ScrollingConfig {
  enabled: boolean;
  patterns: ScrollPattern[];
  acceleration: ScrollAcceleration;
  momentum: ScrollMomentum;
}

export interface ScrollPattern {
  type: ScrollType;
  speed: ScrollSpeed;
  smoothness: number; // 0-1
  variability: number; // 0-1
}

export enum ScrollType {
  WHEEL = 'wheel',
  TRACKPAD = 'trackpad',
  DRAG = 'drag',
  ARROW_KEYS = 'arrow_keys'
}

export interface ScrollSpeed {
  min: number; // pixels per scroll
  max: number; // pixels per scroll
  acceleration: number; // speed increase over time
}

export interface ScrollAcceleration {
  enabled: boolean;
  buildup: number; // seconds to reach max speed
  decay: number; // seconds to stop after input stops
}

export interface ScrollMomentum {
  enabled: boolean;
  duration: number; // seconds
  decay: number; // exponential decay rate
}

export interface GestureConfig {
  enabled: boolean;
  gestures: Gesture[];
  naturalness: number; // 0-1
}

export interface Gesture {
  name: string;
  pattern: GesturePattern;
  triggers: GestureTrigger[];
  variations: GestureVariation[];
}

export interface GesturePattern {
  points: GesturePoint[];
  timing: GestureTiming;
  pressure: GesturePressure[];
}

export interface GesturePoint {
  x: number; // relative position
  y: number; // relative position
  time: number; // milliseconds from start
}

export interface GestureTiming {
  total: number; // milliseconds
  variability: number; // 0-1
  pauses: GesturePause[];
}

export interface GesturePause {
  position: number; // 0-1, position in gesture
  duration: TimeRange;
  probability: number; // 0-1
}

export interface GesturePressure {
  position: number; // 0-1, position in gesture
  pressure: number; // 0-1
}

export interface GestureTrigger {
  context: string;
  probability: number; // 0-1
  alternatives: string[];
}

export interface GestureVariation {
  type: 'speed' | 'path' | 'pressure' | 'timing';
  intensity: number; // 0-1
  frequency: number; // 0-1
}

// Typing Pattern Components

export interface TypingPatternConfig extends ComponentConfig {
  rhythm: TypingRhythm;
  errors: TypingError;
  corrections: TypingCorrection;
  shortcuts: ShortcutUsage;
  fatigue: TypingFatigue;
}

export interface TypingRhythm {
  enabled: boolean;
  baseSpeed: number; // words per minute
  variation: RhythmVariation;
  patterns: RhythmPattern[];
}

export interface RhythmVariation {
  interKey: TimeVariation;
  interWord: TimeVariation;
  interSentence: TimeVariation;
  contextual: ContextualRhythm[];
}

export interface TimeVariation {
  min: number; // milliseconds
  max: number; // milliseconds
  distribution: 'normal' | 'exponential' | 'uniform';
  correlation: number; // -1 to 1, correlation with previous intervals
}

export interface ContextualRhythm {
  context: TypingContext;
  speedMultiplier: number;
  variability: number; // 0-1
}

export enum TypingContext {
  CODE = 'code',
  COMMENT = 'comment',
  VARIABLE_NAME = 'variable_name',
  STRING_LITERAL = 'string_literal',
  NUMBER = 'number',
  SYMBOL = 'symbol',
  TEXT = 'text'
}

export interface RhythmPattern {
  name: string;
  sequence: KeySequence[];
  frequency: number; // 0-1
}

export interface KeySequence {
  keys: string[];
  timing: number[]; // milliseconds between keys
  variability: number[]; // variance for each timing
}

export interface TypingError {
  enabled: boolean;
  frequency: ErrorFrequency;
  types: ErrorType[];
  patterns: ErrorPattern[];
}

export interface ErrorFrequency {
  base: number; // errors per 100 words
  fatigue: number; // multiplier when fatigued
  stress: number; // multiplier when stressed
  complexity: number; // multiplier for complex content
}

export interface ErrorType {
  type: TypingErrorType;
  probability: number; // 0-1
  recovery: ErrorRecovery;
}

export enum TypingErrorType {
  SUBSTITUTION = 'substitution',    // wrong key
  INSERTION = 'insertion',          // extra key
  DELETION = 'deletion',            // missing key
  TRANSPOSITION = 'transposition',  // swapped keys
  REPEAT = 'repeat',               // key held too long
  CASE_ERROR = 'case_error'        // wrong case
}

export interface ErrorRecovery {
  detectionDelay: TimeRange;
  correctionMethod: CorrectionMethod;
  completeness: number; // 0-1, how often errors are fully corrected
}

export enum CorrectionMethod {
  BACKSPACE = 'backspace',
  SELECT_DELETE = 'select_delete',
  WORD_DELETE = 'word_delete',
  IGNORE = 'ignore'
}

export interface ErrorPattern {
  trigger: string; // character or sequence that triggers error
  errorType: TypingErrorType;
  probability: number; // 0-1
  context: TypingContext[];
}

export interface TypingCorrection {
  enabled: boolean;
  strategies: CorrectionStrategy[];
  timing: CorrectionTiming;
  accuracy: CorrectionAccuracy;
}

export interface CorrectionStrategy {
  method: CorrectionMethod;
  priority: number;
  effectiveness: number; // 0-1
  usage: number; // 0-1, how often this method is used
}

export interface CorrectionTiming {
  immediate: number; // 0-1, probability of immediate correction
  delayed: DelayedCorrection;
  batch: BatchCorrection;
}

export interface DelayedCorrection {
  enabled: boolean;
  delay: TimeRange;
  probability: number; // 0-1
  triggers: CorrectionTrigger[];
}

export interface BatchCorrection {
  enabled: boolean;
  threshold: number; // errors before batch correction
  scope: 'word' | 'line' | 'paragraph';
}

export interface CorrectionTrigger {
  type: 'punctuation' | 'whitespace' | 'line_end' | 'pause';
  probability: number; // 0-1
}

export interface CorrectionAccuracy {
  detection: number; // 0-1, how often errors are detected
  correction: number; // 0-1, how often detected errors are corrected
  overcorrection: number; // 0-1, probability of creating new errors while correcting
}

export interface ShortcutUsage {
  enabled: boolean;
  shortcuts: Shortcut[];
  consistency: number; // 0-1
  discovery: ShortcutDiscovery;
}

export interface Shortcut {
  keys: string[];
  action: string;
  usage: number; // 0-1, how often used vs manual method
  accuracy: number; // 0-1, success rate
  alternatives: string[][]; // alternative key combinations
}

export interface ShortcutDiscovery {
  enabled: boolean;
  learningRate: number; // how quickly new shortcuts are adopted
  forgetting: number; // how quickly unused shortcuts are forgotten
  exploration: number; // 0-1, tendency to try new shortcuts
}

export interface TypingFatigue {
  enabled: boolean;
  accumulation: FatigueAccumulation;
  effects: FatigueEffect[];
  recovery: FatigueRecovery;
}

export interface FatigueAccumulation {
  rate: number; // fatigue units per minute
  factors: FatigueFactor[];
  maximum: number; // maximum fatigue level
}

export interface FatigueFactor {
  factor: string;
  multiplier: number;
  threshold?: number;
}

export interface FatigueEffect {
  threshold: number; // fatigue level to trigger effect
  effect: EffectType;
  intensity: number; // 0-1
}

export enum EffectType {
  SPEED_REDUCTION = 'speed_reduction',
  ERROR_INCREASE = 'error_increase',
  VARIABILITY_INCREASE = 'variability_increase',
  PAUSE_INCREASE = 'pause_increase'
}

export interface FatigueRecovery {
  restRate: number; // fatigue units recovered per minute of rest
  activeRecovery: number; // recovery during light activity
  sleepRecovery: number; // recovery during breaks
}

// Authenticity Validation

export interface AuthenticityReport {
  overall: AuthenticityScore;
  components: ComponentScore[];
  detectionResults: DetectionResult[];
  recommendations: AuthenticityRecommendation[];
  timestamp: Date;
}

export interface AuthenticityScore {
  score: number; // 0-1
  confidence: number; // 0-1
  grade: AuthenticityGrade;
  breakdown: ScoreBreakdown;
}

export enum AuthenticityGrade {
  EXCELLENT = 'excellent',  // 97%+
  VERY_GOOD = 'very_good', // 95-97%
  GOOD = 'good',           // 90-95%
  FAIR = 'fair',           // 85-90%
  POOR = 'poor'            // <85%
}

export interface ScoreBreakdown {
  speech: number; // 0-1
  behavior: number; // 0-1
  timing: number; // 0-1
  variation: number; // 0-1
  consistency: number; // 0-1
}

export interface ComponentScore {
  component: ComponentType;
  score: number; // 0-1
  contribution: number; // 0-1, contribution to overall score
  issues: ComponentIssue[];
}

export interface ComponentIssue {
  type: 'pattern' | 'timing' | 'variation' | 'artifact';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface DetectionResult {
  detector: string;
  result: DetectionOutcome;
  confidence: number; // 0-1
  details: DetectionDetail[];
}

export enum DetectionOutcome {
  HUMAN = 'human',
  AI_GENERATED = 'ai_generated',
  UNCERTAIN = 'uncertain',
  ERROR = 'error'
}

export interface DetectionDetail {
  metric: string;
  value: number;
  threshold: number;
  passed: boolean;
  explanation: string;
}

export interface AuthenticityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  component: ComponentType;
  issue: string;
  recommendation: string;
  expectedImprovement: number; // 0-1
  effort: 'low' | 'medium' | 'high';
}