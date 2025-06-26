// Personal Brand Learning System Types

export interface PersonalBrandProfile {
  userId: string;
  niche: NicheProfile;
  brandVoice: BrandVoice;
  performanceHistory: PerformanceHistory;
  audienceInsights: AudienceInsights;
  optimizationSettings: OptimizationSettings;
  evolutionTimeline: BrandEvolution[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NicheProfile {
  primary: string;
  secondary: string[];
  audienceLevel: AudienceLevel;
  techStack: string[];
  industries: string[];
  contentTypes: ContentType[];
  geographicFocus: string[];
  languagePreference: string[];
  confidence: number; // 0-1, how confident we are in niche classification
}

export enum AudienceLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced',
  MIXED = 'mixed',
  EXPERT = 'expert'
}

export enum ContentType {
  TUTORIAL = 'tutorial',
  DEMO = 'demo',
  DEEP_DIVE = 'deep_dive',
  QUICK_TIP = 'quick_tip',
  PROBLEM_SOLVING = 'problem_solving',
  REVIEW = 'review',
  COMPARISON = 'comparison',
  NEWS_UPDATE = 'news_update'
}

export interface BrandVoice {
  tone: BrandTone;
  personality: PersonalityTraits[];
  communicationStyle: CommunicationStyle;
  catchPhrases: string[];
  vocabulary: VocabularyProfile;
  humorStyle?: HumorStyle;
  teachingStyle: TeachingStyle;
  consistency: number; // 0-1
}

export enum BrandTone {
  CASUAL = 'casual',
  PROFESSIONAL = 'professional',
  EDUCATIONAL = 'educational',
  ENTERTAINING = 'entertaining',
  AUTHORITATIVE = 'authoritative',
  FRIENDLY = 'friendly',
  TECHNICAL = 'technical'
}

export enum PersonalityTraits {
  ENTHUSIASTIC = 'enthusiastic',
  PATIENT = 'patient',
  DETAIL_ORIENTED = 'detail_oriented',
  BIG_PICTURE = 'big_picture',
  PRACTICAL = 'practical',
  THEORETICAL = 'theoretical',
  ENCOURAGING = 'encouraging',
  DIRECT = 'direct',
  METHODICAL = 'methodical',
  CREATIVE = 'creative'
}

export interface CommunicationStyle {
  pace: 'slow' | 'medium' | 'fast' | 'variable';
  structure: 'linear' | 'modular' | 'exploratory';
  interaction: 'monologue' | 'conversational' | 'interactive';
  explanation: 'bottom_up' | 'top_down' | 'example_first';
  complexity: 'gradual' | 'direct' | 'layered';
}

export interface VocabularyProfile {
  preferred: string[];
  avoided: string[];
  jargonLevel: 'minimal' | 'moderate' | 'heavy';
  metaphorUsage: boolean;
  analogyPreference: string[];
}

export enum HumorStyle {
  NONE = 'none',
  DRY = 'dry',
  PLAYFUL = 'playful',
  SARCASTIC = 'sarcastic',
  SELF_DEPRECATING = 'self_deprecating',
  OBSERVATIONAL = 'observational'
}

export interface TeachingStyle {
  approach: TeachingApproach;
  pacing: PacingStrategy;
  repetition: RepetitionStrategy;
  examples: ExampleStrategy;
  assessment: AssessmentStrategy;
}

export enum TeachingApproach {
  SHOW_THEN_TELL = 'show_then_tell',
  TELL_THEN_SHOW = 'tell_then_show',
  LEARN_BY_DOING = 'learn_by_doing',
  PROBLEM_BASED = 'problem_based',
  CONCEPT_FIRST = 'concept_first'
}

export interface PacingStrategy {
  setup: 'quick' | 'thorough' | 'minimal';
  explanation: 'detailed' | 'concise' | 'layered';
  demonstration: 'step_by_step' | 'overview' | 'guided_discovery';
  conclusion: 'summary' | 'next_steps' | 'call_to_action';
}

export interface RepetitionStrategy {
  keyPoints: boolean;
  concepts: boolean;
  commands: boolean;
  summaries: boolean;
  frequency: 'low' | 'medium' | 'high';
}

export interface ExampleStrategy {
  realWorld: boolean;
  progressive: boolean;
  multiple: boolean;
  contrasting: boolean;
  userSubmitted: boolean;
}

export interface AssessmentStrategy {
  checkIns: boolean;
  practice: boolean;
  challenges: boolean;
  reflection: boolean;
  community: boolean;
}

export interface PerformanceHistory {
  videos: VideoPerformance[];
  patterns: SuccessPattern[];
  benchmarks: PerformanceBenchmark[];
  growth: GrowthMetrics;
  platformSpecific: Map<string, PlatformPerformance>;
}

export interface VideoPerformance {
  videoId: string;
  title: string;
  publishDate: Date;
  platform: string;
  metrics: VideoMetrics;
  audience: AudienceBreakdown;
  testPrediction?: TestPrediction;
  actualVsPredicted?: VarianceAnalysis;
  learnings: string[];
}

export interface VideoMetrics {
  views: number;
  engagement: number; // 0-1
  retention: RetentionMetrics;
  interactions: InteractionMetrics;
  conversion: ConversionMetrics;
  sentiment: SentimentMetrics;
}

export interface RetentionMetrics {
  average: number; // 0-1
  curve: RetentionPoint[];
  dropOffPoints: DropOffPoint[];
  recoveryPoints: RecoveryPoint[];
}

export interface RetentionPoint {
  timestamp: number; // seconds
  percentage: number; // 0-100
}

export interface RecoveryPoint {
  timestamp: number;
  magnitude: number; // how much retention recovered
  trigger: string;
}

export interface InteractionMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughs: number;
  subscriptions: number;
}

export interface ConversionMetrics {
  subscribeRate: number; // 0-1
  engagementRate: number; // 0-1
  shareRate: number; // 0-1
  clickThroughRate: number; // 0-1
  conversionFunnel: ConversionStep[];
}

export interface ConversionStep {
  step: string;
  entered: number;
  completed: number;
  conversionRate: number; // 0-1
}

export interface SentimentMetrics {
  overall: number; // -1 to 1
  breakdown: SentimentBreakdown;
  keywords: SentimentKeyword[];
  evolution: SentimentEvolution[];
}

export interface SentimentBreakdown {
  positive: number; // percentage
  neutral: number;
  negative: number;
}

export interface SentimentKeyword {
  keyword: string;
  sentiment: number; // -1 to 1
  frequency: number;
}

export interface SentimentEvolution {
  timestamp: number; // seconds
  sentiment: number; // -1 to 1
  volume: number; // number of comments
}

export interface AudienceBreakdown {
  demographics: AudienceDemographics;
  behavior: AudienceBehavior;
  engagement: AudienceEngagement;
  growth: AudienceGrowth;
}

export interface AudienceDemographics {
  ageGroups: Map<string, number>;
  locations: Map<string, number>;
  devices: Map<string, number>;
  languages: Map<string, number>;
  experience: Map<ExpertiseLevel, number>;
}

export interface AudienceBehavior {
  viewingPatterns: ViewingPatterns;
  interactionPatterns: InteractionPatterns;
  contentPreferences: ContentPreferences;
  loyalty: LoyaltyMetrics;
}

export interface ViewingPatterns {
  sessionDuration: number; // seconds
  repeatViews: number; // percentage
  binge: boolean;
  timeOfDay: Map<string, number>;
  dayOfWeek: Map<string, number>;
}

export interface InteractionPatterns {
  commentTiming: number[]; // timestamps when comments occur
  likeBehavior: 'early' | 'throughout' | 'end';
  shareTriggers: string[];
  subscribeTriggers: string[];
}

export interface LoyaltyMetrics {
  returnViewers: number; // percentage
  subscriptionRate: number; // 0-1
  engagementConsistency: number; // 0-1
  advocacy: number; // 0-1, likelihood to recommend
}

export interface AudienceEngagement {
  byTimestamp: EngagementPoint[];
  byContent: EngagementByContent[];
  byDemographic: Map<string, number>;
  patterns: EngagementPattern[];
}

export interface EngagementPoint {
  timestamp: number;
  level: number; // 0-1
  type: string[];
  trigger: string;
}

export interface EngagementByContent {
  contentType: string;
  segment: TimeRange;
  engagement: number; // 0-1
  audience: PersonaType[];
}

export interface EngagementPattern {
  pattern: string;
  frequency: number;
  effectiveness: number; // 0-1
  audience: PersonaType[];
}

export interface AudienceGrowth {
  newSubscribers: number;
  churnRate: number; // 0-1
  growthRate: number; // percentage
  virality: number; // 0-1
  wordOfMouth: number; // 0-1
}

export interface TestPrediction {
  testAudienceResults: TestAudienceResults;
  predictedMetrics: PredictedMetrics;
  confidence: number; // 0-1
}

export interface VarianceAnalysis {
  accuracy: number; // 0-1
  overestimations: MetricVariance[];
  underestimations: MetricVariance[];
  insights: string[];
  modelAdjustments: string[];
}

export interface MetricVariance {
  metric: string;
  predicted: number;
  actual: number;
  variance: number; // percentage
  reasons: string[];
}

export interface SuccessPattern {
  pattern: string;
  frequency: number;
  effectiveness: number; // 0-1
  contexts: string[];
  examples: string[];
  confidence: number; // 0-1
  lastSeen: Date;
}

export interface PerformanceBenchmark {
  metric: string;
  baseline: number;
  current: number;
  target: number;
  percentile: number; // compared to similar creators
  trend: 'improving' | 'stable' | 'declining';
  timeframe: string;
}

export interface GrowthMetrics {
  followerGrowth: GrowthTrend;
  engagementGrowth: GrowthTrend;
  reachGrowth: GrowthTrend;
  brandStrength: BrandStrength;
  nicheAuthority: number; // 0-1
}

export interface GrowthTrend {
  current: number;
  change: number; // percentage
  velocity: number; // rate of change
  acceleration: number; // change in velocity
  projection: GrowthProjection[];
}

export interface GrowthProjection {
  timeframe: string;
  projected: number;
  confidence: number; // 0-1
  scenarios: ScenarioProjection[];
}

export interface ScenarioProjection {
  scenario: 'conservative' | 'likely' | 'optimistic';
  value: number;
  probability: number; // 0-1
}

export interface BrandStrength {
  recognition: number; // 0-1
  differentiation: number; // 0-1
  consistency: number; // 0-1
  authority: number; // 0-1
  trust: number; // 0-1
  overall: number; // 0-1
}

export interface PlatformPerformance {
  platform: string;
  metrics: VideoMetrics;
  audienceSize: number;
  growthRate: number;
  engagement: number; // 0-1
  bestPerformingContent: ContentType[];
  platformSpecificInsights: string[];
}

export interface AudienceInsights {
  primaryAudience: AudienceSegment;
  secondaryAudiences: AudienceSegment[];
  audienceEvolution: AudienceEvolutionPoint[];
  retention: RetentionInsights;
  acquisition: AcquisitionInsights;
}

export interface AudienceSegment {
  name: string;
  size: number; // percentage of total audience
  characteristics: AudienceCharacteristics;
  behavior: AudienceBehavior;
  value: number; // 0-1, relative value to creator
  growth: number; // percentage growth
}

export interface AudienceCharacteristics {
  demographics: AudienceDemographics;
  psychographics: Psychographics;
  technographics: Technographics;
  goals: string[];
  painPoints: string[];
}

export interface Psychographics {
  values: string[];
  interests: string[];
  attitudes: string[];
  lifestyle: string[];
  personality: PersonalityTraits[];
}

export interface Technographics {
  experience: ExpertiseLevel;
  techStack: string[];
  tools: string[];
  platforms: string[];
  learningStyle: string[];
}

export interface AudienceEvolutionPoint {
  timestamp: Date;
  changes: AudienceChange[];
  triggers: string[];
  impact: number; // -1 to 1
}

export interface AudienceChange {
  type: 'demographic' | 'behavioral' | 'preference';
  description: string;
  magnitude: number; // 0-1
  direction: 'positive' | 'negative' | 'neutral';
}

export interface RetentionInsights {
  retentionRate: number; // 0-1
  churnReasons: ChurnReason[];
  loyaltyFactors: LoyaltyFactor[];
  retentionStrategies: string[];
}

export interface ChurnReason {
  reason: string;
  frequency: number; // percentage
  segments: AudienceSegment[];
  mitigation: string[];
}

export interface LoyaltyFactor {
  factor: string;
  impact: number; // -1 to 1
  segments: AudienceSegment[];
  actionable: boolean;
}

export interface AcquisitionInsights {
  sources: AcquisitionSource[];
  conversionFunnel: AcquisitionFunnel;
  cost: AcquisitionCost;
  optimization: AcquisitionOptimization[];
}

export interface AcquisitionSource {
  source: string;
  percentage: number;
  quality: number; // 0-1, based on retention/engagement
  cost: number; // cost per acquisition
  trend: 'growing' | 'stable' | 'declining';
}

export interface AcquisitionFunnel {
  awareness: number;
  interest: number;
  consideration: number;
  conversion: number;
  retention: number;
}

export interface AcquisitionCost {
  costPerView: number;
  costPerSubscriber: number;
  costPerEngagement: number;
  roi: number; // return on investment
}

export interface AcquisitionOptimization {
  opportunity: string;
  impact: number; // 0-1
  effort: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  tactics: string[];
}

export interface OptimizationSettings {
  autoApplyLearnings: boolean;
  experimentationLevel: ExperimentationLevel;
  focusMetrics: FocusMetric[];
  learningPreferences: LearningPreferences;
  privacySettings: PrivacySettings;
}

export enum ExperimentationLevel {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

export enum FocusMetric {
  ENGAGEMENT = 'engagement',
  COMPLETION = 'completion',
  SHARES = 'shares',
  COMMENTS = 'comments',
  SUBSCRIBERS = 'subscribers',
  REACH = 'reach',
  BRAND_BUILDING = 'brand_building'
}

export interface LearningPreferences {
  feedbackFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  actionableOnly: boolean;
  benchmarking: boolean;
  competitive: boolean;
}

export interface PrivacySettings {
  shareAggregatedData: boolean;
  allowBenchmarking: boolean;
  participateInResearch: boolean;
  dataRetention: number; // days
}

export interface BrandEvolution {
  timestamp: Date;
  version: number;
  changes: BrandChange[];
  triggers: EvolutionTrigger[];
  impact: EvolutionImpact;
  rollback?: boolean;
}

export interface BrandChange {
  aspect: 'voice' | 'niche' | 'audience' | 'strategy' | 'content';
  before: any;
  after: any;
  reason: string;
  confidence: number; // 0-1
}

export interface EvolutionTrigger {
  type: 'performance' | 'feedback' | 'market' | 'strategy' | 'experiment';
  description: string;
  data: any;
  weight: number; // 0-1
}

export interface EvolutionImpact {
  immediate: ImpactMetrics;
  shortTerm: ImpactMetrics; // 1-4 weeks
  longTerm: ImpactMetrics; // 1-6 months
  overall: number; // -1 to 1
}

export interface ImpactMetrics {
  engagement: number; // -1 to 1, change
  growth: number; // -1 to 1, change
  satisfaction: number; // -1 to 1, change
  brandStrength: number; // -1 to 1, change
}