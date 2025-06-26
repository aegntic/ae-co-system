// AI Test Audience System Types - 50-100 Synthetic Viewers

export interface SyntheticViewer {
  id: string;
  persona: ViewerPersona;
  behavior: ViewerBehavior;
  preferences: ViewerPreferences;
  expertiseLevel: ExpertiseLevel;
  attentionPatterns: AttentionPattern;
  engagementHistory: EngagementHistory;
}

export interface ViewerPersona {
  type: PersonaType;
  demographics: Demographics;
  background: ProfessionalBackground;
  interests: string[];
  painPoints: string[];
  goals: string[];
  personality: PersonalityTraits;
}

export enum PersonaType {
  JUNIOR_DEVELOPER = 'junior_developer',
  SENIOR_DEVELOPER = 'senior_developer',
  TECH_LEAD = 'tech_lead',
  PRODUCT_MANAGER = 'product_manager',
  DESIGNER = 'designer',
  DEVOPS_ENGINEER = 'devops_engineer',
  STUDENT = 'student',
  HOBBYIST = 'hobbyist',
  ENTREPRENEUR = 'entrepreneur',
  CONSULTANT = 'consultant'
}

export interface Demographics {
  ageRange: string;
  location: string;
  timezone: string;
  nativeLanguage: string;
  workingHours: string;
  devicePreference: 'desktop' | 'mobile' | 'tablet';
}

export interface ProfessionalBackground {
  experience: string; // e.g., "2-4 years"
  primaryTech: string[];
  secondaryTech: string[];
  industryFocus: string[];
  currentRole: string;
  teamSize: string;
  workEnvironment: 'startup' | 'corporate' | 'agency' | 'freelance';
}

export interface PersonalityTraits {
  patience: number; // 0-1
  curiosity: number; // 0-1
  attentionSpan: number; // seconds
  detailOriented: boolean;
  skipProne: boolean;
  feedbackMotivated: boolean;
  communityOriented: boolean;
}

export enum ExpertiseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export interface ViewerBehavior {
  viewingPatterns: ViewingPattern;
  interactionStyle: InteractionStyle;
  contentPreferences: ContentPreferences;
  skipTriggers: SkipTrigger[];
  engagementTriggers: EngagementTrigger[];
}

export interface ViewingPattern {
  preferredSpeed: number; // 0.5x to 2x
  pauseFrequency: 'never' | 'rare' | 'moderate' | 'frequent';
  rewindBehavior: 'never' | 'confused' | 'detailed' | 'always';
  multiTasking: boolean;
  fullScreenPreference: boolean;
  subtitleUsage: boolean;
}

export interface InteractionStyle {
  commentLikelihood: number; // 0-1
  shareLikelihood: number; // 0-1
  likeLikelihood: number; // 0-1
  subscriptionTrigger: string[];
  notificationSettings: string[];
}

export interface ContentPreferences {
  pacing: 'slow' | 'normal' | 'fast';
  depth: 'surface' | 'moderate' | 'deep';
  style: 'formal' | 'casual' | 'entertaining';
  structure: 'linear' | 'modular' | 'exploratory';
  codeStyle: 'step_by_step' | 'overview_first' | 'problem_solution';
}

export interface SkipTrigger {
  type: SkipTriggerType;
  threshold: number;
  context: string[];
}

export enum SkipTriggerType {
  BORING_CONTENT = 'boring_content',
  TOO_COMPLEX = 'too_complex',
  TOO_SIMPLE = 'too_simple',
  POOR_AUDIO = 'poor_audio',
  POOR_VISUAL = 'poor_visual',
  LONG_SETUP = 'long_setup',
  NO_VALUE_PROP = 'no_value_prop',
  TECHNICAL_ISSUES = 'technical_issues'
}

export interface EngagementTrigger {
  type: EngagementTriggerType;
  threshold: number;
  multiplier: number;
}

export enum EngagementTriggerType {
  AHA_MOMENT = 'aha_moment',
  PROBLEM_SOLVING = 'problem_solving',
  RELEVANT_TECH = 'relevant_tech',
  PRACTICAL_EXAMPLE = 'practical_example',
  HUMOR = 'humor',
  VISUAL_APPEAL = 'visual_appeal',
  CLEAR_EXPLANATION = 'clear_explanation'
}

export interface AttentionPattern {
  hookTolerance: number; // seconds before losing interest
  concentrationCurve: ConcentrationPoint[];
  distractionSusceptibility: number; // 0-1
  recoveryLikelihood: number; // 0-1 after distraction
  peakAttentionTime: number; // seconds from start
}

export interface ConcentrationPoint {
  timestamp: number; // seconds
  level: number; // 0-1
  factors: string[];
}

export interface EngagementHistory {
  previousVideos: VideoEngagement[];
  learningProgress: LearningProgress;
  preferences: LearnedPreferences;
  behaviorEvolution: BehaviorChange[];
}

export interface VideoEngagement {
  videoId: string;
  watchTime: number; // seconds
  totalDuration: number; // seconds
  completionRate: number; // 0-1
  interactions: Interaction[];
  sentiment: 'positive' | 'neutral' | 'negative';
  learned: boolean;
}

export interface Interaction {
  type: 'like' | 'dislike' | 'comment' | 'share' | 'subscribe' | 'skip';
  timestamp: number;
  context: string;
}

export interface LearningProgress {
  skillAreas: Map<string, number>; // skill -> proficiency (0-1)
  conceptsFamiliar: string[];
  conceptsLearning: string[];
  conceptsStrugglingWith: string[];
}

export interface LearnedPreferences {
  favoriteInstructors: string[];
  preferredTopics: string[];
  avoidedTopics: string[];
  optimalVideoLength: number; // seconds
  preferredComplexity: string;
}

export interface BehaviorChange {
  timestamp: Date;
  change: string;
  trigger: string;
  impact: number; // -1 to 1
}

// Test Audience Evaluation

export interface TestAudienceConfig {
  size: number; // 50-100 viewers
  personaDistribution: PersonaDistribution;
  diversityRequirements: DiversityRequirements;
  evaluationCriteria: EvaluationCriteria;
}

export interface PersonaDistribution {
  juniorDeveloper: number; // percentage
  seniorDeveloper: number;
  techLead: number;
  productManager: number;
  other: number;
}

export interface DiversityRequirements {
  experienceLevels: ExpertiseLevel[];
  techStacks: string[];
  industries: string[];
  geographicDistribution: string[];
  demographicBalance: boolean;
}

export interface EvaluationCriteria {
  engagementMetrics: EngagementMetric[];
  qualityMetrics: QualityMetric[];
  learningMetrics: LearningMetric[];
  brandMetrics: BrandMetric[];
}

export interface EngagementMetric {
  name: string;
  weight: number; // 0-1
  threshold: number;
  targetAudience: PersonaType[];
}

export interface QualityMetric {
  name: string;
  measurement: 'objective' | 'subjective';
  scale: string;
  weight: number;
}

export interface LearningMetric {
  name: string;
  knowledge_transfer: number; // 0-1
  comprehension: number; // 0-1
  retention: number; // 0-1
}

export interface BrandMetric {
  name: string;
  brandAlignment: number; // 0-1
  audienceResonance: number; // 0-1
  differentiationScore: number; // 0-1
}

// Test Results

export interface TestAudienceResults {
  overall: OverallResults;
  byPersona: Map<PersonaType, PersonaResults>;
  byTimestamp: TimelineResults[];
  optimization: OptimizationSuggestions;
  prediction: PerformancePrediction;
}

export interface OverallResults {
  averageEngagement: number; // 0-1
  completionRate: number; // 0-1
  satisfaction: number; // 0-1
  viralPotential: number; // 0-1
  qualityScore: number; // 0-1
  brandAlignment: number; // 0-1
}

export interface PersonaResults {
  engagement: number;
  dropOffPoints: DropOffPoint[];
  feedback: ViewerFeedback[];
  behaviorAnalysis: BehaviorAnalysis;
  recommendations: string[];
}

export interface DropOffPoint {
  timestamp: number; // seconds
  percentage: number; // 0-100, viewers who dropped off
  reasons: DropOffReason[];
  recovery: number; // 0-1, likelihood of recovery
}

export interface DropOffReason {
  reason: string;
  confidence: number; // 0-1
  frequency: number; // how many viewers
}

export interface ViewerFeedback {
  viewerId: string;
  rating: number; // 1-5
  comments: string[];
  suggestions: string[];
  highlights: TimeRange[];
  lowlights: TimeRange[];
}

export interface TimeRange {
  start: number; // seconds
  end: number; // seconds
  reason: string;
}

export interface BehaviorAnalysis {
  attentionPattern: number[]; // attention level by second
  interactionPoints: InteractionPoint[];
  learningCurve: LearningPoint[];
  emotionalJourney: EmotionalPoint[];
}

export interface InteractionPoint {
  timestamp: number;
  type: string;
  intensity: number; // 0-1
  trigger: string;
}

export interface LearningPoint {
  timestamp: number;
  concept: string;
  comprehension: number; // 0-1
  retention: number; // 0-1
}

export interface EmotionalPoint {
  timestamp: number;
  emotion: 'confused' | 'excited' | 'bored' | 'frustrated' | 'satisfied';
  intensity: number; // 0-1
}

export interface TimelineResults {
  timestamp: number; // seconds
  metrics: TimelineMetrics;
  events: TimelineEvent[];
}

export interface TimelineMetrics {
  viewerCount: number;
  attentionLevel: number; // 0-1
  engagement: number; // 0-1
  comprehension: number; // 0-1
  sentiment: number; // -1 to 1
}

export interface TimelineEvent {
  type: 'hook' | 'explanation' | 'demo' | 'transition' | 'conclusion';
  effectiveness: number; // 0-1
  audienceReaction: string;
}

export interface OptimizationSuggestions {
  title: TitleOptimization;
  thumbnail: ThumbnailOptimization;
  hooks: HookOptimization[];
  pacing: PacingOptimization;
  content: ContentOptimization[];
  callToActions: CTAOptimization[];
}

export interface TitleOptimization {
  current: string;
  suggestions: TitleSuggestion[];
  predictedCTR: number; // 0-1
  reasoning: string;
}

export interface TitleSuggestion {
  title: string;
  predictedCTR: number;
  targetAudience: PersonaType[];
  reasoning: string;
}

export interface ThumbnailOptimization {
  currentScore: number; // 0-1
  suggestions: ThumbnailSuggestion[];
  designPrinciples: string[];
}

export interface ThumbnailSuggestion {
  description: string;
  elements: string[];
  colorScheme: string[];
  textOverlay: string;
  predictedCTR: number;
}

export interface HookOptimization {
  timestamp: number; // seconds (3, 10, 30)
  currentEffectiveness: number; // 0-1
  issues: string[];
  suggestions: string[];
  alternatives: HookAlternative[];
}

export interface HookAlternative {
  approach: string;
  content: string;
  predictedRetention: number; // 0-1
  targetAudience: PersonaType[];
}

export interface PacingOptimization {
  overallPacing: 'too_fast' | 'too_slow' | 'optimal';
  segments: PacingSegment[];
  recommendations: string[];
}

export interface PacingSegment {
  start: number; // seconds
  end: number; // seconds
  currentPace: 'slow' | 'medium' | 'fast';
  optimalPace: 'slow' | 'medium' | 'fast';
  reason: string;
}

export interface ContentOptimization {
  timestamp: number;
  type: 'add' | 'remove' | 'modify' | 'reorder';
  description: string;
  reasoning: string;
  impact: number; // 0-1
}

export interface CTAOptimization {
  timestamp: number;
  current?: string;
  suggested: string;
  type: 'subscribe' | 'like' | 'comment' | 'share' | 'follow';
  effectiveness: number; // 0-1
}

export interface PerformancePrediction {
  platforms: Map<string, PlatformPrediction>;
  timeHorizons: Map<string, TimeHorizonPrediction>;
  scenarios: ScenarioPrediction[];
  confidence: number; // 0-1
}

export interface PlatformPrediction {
  platform: string;
  metrics: PredictedMetrics;
  ranking: number;
  viralPotential: number; // 0-1
}

export interface PredictedMetrics {
  views: number;
  engagement: number; // 0-1
  retention: number; // 0-1
  shares: number;
  comments: number;
  likes: number;
}

export interface TimeHorizonPrediction {
  period: string; // '24h', '7d', '30d', '1y'
  metrics: PredictedMetrics;
  confidence: number; // 0-1
}

export interface ScenarioPrediction {
  scenario: string;
  probability: number; // 0-1
  metrics: PredictedMetrics;
  description: string;
}