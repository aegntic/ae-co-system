// User Management and Profile Types

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  subscription: SubscriptionInfo;
  preferences: UserPreferences;
  statistics: UserStatistics;
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks: SocialLink[];
  location?: Location;
  timezone: string;
  language: string;
  role: UserRole;
  experience: ExperienceProfile;
  interests: string[];
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  username: string;
  verified: boolean;
}

export enum SocialPlatform {
  GITHUB = 'github',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  DISCORD = 'discord',
  STACKOVERFLOW = 'stackoverflow',
  DEV_TO = 'dev_to',
  MEDIUM = 'medium',
  PERSONAL_WEBSITE = 'personal_website'
}

export interface Location {
  country: string;
  region?: string;
  city?: string;
  timezone: string;
}

export enum UserRole {
  INDIVIDUAL = 'individual',
  TEAM_MEMBER = 'team_member',
  TEAM_LEAD = 'team_lead',
  ADMIN = 'admin',
  ENTERPRISE_USER = 'enterprise_user',
  CONTENT_CREATOR = 'content_creator',
  EDUCATOR = 'educator',
  CONSULTANT = 'consultant'
}

export interface ExperienceProfile {
  level: ExpertiseLevel;
  yearsOfExperience: number;
  primaryTechnologies: string[];
  secondaryTechnologies: string[];
  domains: string[];
  certifications: Certification[];
  achievements: Achievement[];
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId: string;
  verified: boolean;
}

export interface Achievement {
  title: string;
  description: string;
  category: AchievementCategory;
  earnedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export enum AchievementCategory {
  CONTENT_CREATION = 'content_creation',
  TECHNICAL_SKILL = 'technical_skill',
  COMMUNITY = 'community',
  EDUCATION = 'education',
  INNOVATION = 'innovation',
  COLLABORATION = 'collaboration'
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  usage: UsageMetrics;
  limits: UsageLimits;
  addOns: AddOn[];
  paymentMethod?: PaymentMethod;
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime'
}

export interface UsageMetrics {
  currentPeriod: PeriodUsage;
  previousPeriod: PeriodUsage;
  allTime: AllTimeUsage;
  dailyUsage: DailyUsage[];
}

export interface PeriodUsage {
  projects: number;
  videosCreated: number;
  videoMinutes: number;
  exports: number;
  storageUsed: number; // bytes
  aiRequestsUsed: number;
  testAudienceRuns: number;
}

export interface AllTimeUsage {
  totalProjects: number;
  totalVideos: number;
  totalMinutes: number;
  totalExports: number;
  totalStorageUsed: number; // bytes
  totalAiRequests: number;
  joinedAt: Date;
}

export interface DailyUsage {
  date: Date;
  projects: number;
  videos: number;
  minutes: number;
  exports: number;
  storage: number; // bytes
}

export interface UsageLimits {
  maxProjects: number;
  maxVideoMinutes: number;
  maxExportsPerMonth: number;
  maxStorageBytes: number;
  maxAiRequestsPerMonth: number;
  maxTestAudienceRuns: number;
  features: FeatureLimit[];
}

export interface FeatureLimit {
  feature: string;
  limit: number;
  unlimited: boolean;
  resetPeriod: 'daily' | 'monthly' | 'yearly' | 'never';
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  usage: any;
  limits: any;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'other';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  default: boolean;
}

export interface UserPreferences {
  capture: CapturePreferences;
  processing: ProcessingPreferences;
  ai: AIPreferences;
  ui: UIPreferences;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  sharing: SharingPreferences;
}

export interface CapturePreferences {
  defaultQuality: CaptureQuality;
  defaultFps: number;
  autoStart: boolean;
  pauseOnInactivity: boolean;
  inactivityTimeout: number; // minutes
  hotkeys: HotkeyConfig[];
  monitorSelection: 'primary' | 'all' | 'custom';
  audioDefault: AudioSource;
}

export interface HotkeyConfig {
  action: string;
  key: string;
  modifiers: string[];
  enabled: boolean;
}

export interface ProcessingPreferences {
  defaultTemplate: string;
  autoOptimization: boolean;
  qualityPreset: QualityPreset;
  compressionLevel: 'low' | 'medium' | 'high';
  gpuAcceleration: boolean;
  backgroundProcessing: boolean;
}

export interface AIPreferences {
  narrationEnabled: boolean;
  defaultVoice: string;
  narrationSpeed: number; // 0.5 to 2.0
  testAudienceEnabled: boolean;
  personalBrandLearning: boolean;
  autoOptimization: boolean;
  suggestionLevel: 'minimal' | 'moderate' | 'aggressive';
  modelPreference: ModelPreference;
}

export interface ModelPreference {
  primary: string;
  fallback: string[];
  costOptimization: boolean;
  latencyOptimization: boolean;
  qualityThreshold: number; // 0-1
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  density: 'compact' | 'comfortable' | 'spacious';
  animations: boolean;
  tooltips: boolean;
  shortcuts: boolean;
  layout: LayoutPreferences;
}

export interface LayoutPreferences {
  sidebarPosition: 'left' | 'right';
  panelLayout: 'horizontal' | 'vertical' | 'auto';
  defaultView: 'timeline' | 'properties' | 'preview';
  customPanels: PanelConfig[];
}

export interface PanelConfig {
  id: string;
  name: string;
  position: string;
  size: number; // percentage
  visible: boolean;
  order: number;
}

export interface NotificationPreferences {
  email: EmailNotificationConfig;
  inApp: InAppNotificationConfig;
  push: PushNotificationConfig;
  frequency: NotificationFrequency;
}

export interface EmailNotificationConfig {
  enabled: boolean;
  processingComplete: boolean;
  exportReady: boolean;
  quotaWarning: boolean;
  newFeatures: boolean;
  tips: boolean;
  marketing: boolean;
}

export interface InAppNotificationConfig {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  progress: boolean;
  errors: boolean;
  suggestions: boolean;
}

export interface PushNotificationConfig {
  enabled: boolean;
  mobile: boolean;
  desktop: boolean;
  critical: boolean;
  updates: boolean;
}

export enum NotificationFrequency {
  REAL_TIME = 'real_time',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  NEVER = 'never'
}

export interface PrivacyPreferences {
  dataCollection: DataCollectionConfig;
  analytics: AnalyticsConfig;
  sharing: PrivacySharingConfig;
  retention: RetentionConfig;
}

export interface DataCollectionConfig {
  usage: boolean;
  performance: boolean;
  errors: boolean;
  feedback: boolean;
  location: boolean;
  demographic: boolean;
}

export interface AnalyticsConfig {
  enabled: boolean;
  anonymized: boolean;
  thirdParty: boolean;
  tracking: boolean;
  cookies: CookieConfig;
}

export interface CookieConfig {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface PrivacySharingConfig {
  aggregatedData: boolean;
  benchmarking: boolean;
  research: boolean;
  marketing: boolean;
  partners: boolean;
}

export interface RetentionConfig {
  dataRetentionPeriod: number; // days
  autoDelete: boolean;
  exportBeforeDelete: boolean;
  customRetention: CustomRetentionRule[];
}

export interface CustomRetentionRule {
  dataType: string;
  retentionPeriod: number; // days
  condition: string;
}

export interface SharingPreferences {
  defaultPrivacy: 'private' | 'unlisted' | 'public';
  socialSharing: SocialSharingConfig;
  collaboration: CollaborationConfig;
  embedding: EmbeddingConfig;
}

export interface SocialSharingConfig {
  autoShare: boolean;
  platforms: SocialPlatform[];
  templates: SharingTemplate[];
  hashtags: string[];
}

export interface SharingTemplate {
  platform: SocialPlatform;
  template: string;
  variables: string[];
  default: boolean;
}

export interface CollaborationConfig {
  allowComments: boolean;
  allowSuggestions: boolean;
  approvalWorkflow: boolean;
  teamVisibility: 'all' | 'team_only' | 'admin_only';
}

export interface EmbeddingConfig {
  allowEmbedding: boolean;
  allowDownload: boolean;
  showControls: boolean;
  showTitle: boolean;
  showBranding: boolean;
}

export interface UserStatistics {
  engagement: EngagementStatistics;
  productivity: ProductivityStatistics;
  quality: QualityStatistics;
  growth: GrowthStatistics;
  achievements: AchievementStatistics;
}

export interface EngagementStatistics {
  totalSessions: number;
  totalTimeSpent: number; // minutes
  averageSessionDuration: number; // minutes
  lastActive: Date;
  streak: StreakInfo;
  featureUsage: FeatureUsageStats[];
}

export interface StreakInfo {
  current: number; // days
  longest: number; // days
  total: number; // days
  lastUpdate: Date;
}

export interface FeatureUsageStats {
  feature: string;
  usageCount: number;
  lastUsed: Date;
  proficiency: number; // 0-1
}

export interface ProductivityStatistics {
  videosPerWeek: number;
  averageVideoLength: number; // minutes
  processingEfficiency: number; // 0-1
  automationUsage: number; // 0-1
  errorRate: number; // 0-1
  timeToPublish: number; // hours
}

export interface QualityStatistics {
  averageQualityScore: number; // 0-1
  improvementRate: number; // percentage
  consistencyScore: number; // 0-1
  audienceSatisfaction: number; // 0-1
  technicalQuality: number; // 0-1
  contentQuality: number; // 0-1
}

export interface GrowthStatistics {
  skillProgression: SkillProgression[];
  learningVelocity: number; // skills per month
  competencyAreas: CompetencyArea[];
  recommendations: LearningRecommendation[];
}

export interface SkillProgression {
  skill: string;
  currentLevel: number; // 0-1
  previousLevel: number; // 0-1
  improvementRate: number; // percentage
  timeToMastery: number; // days
}

export interface CompetencyArea {
  area: string;
  level: 'novice' | 'advanced_beginner' | 'competent' | 'proficient' | 'expert';
  confidence: number; // 0-1
  evidence: string[];
}

export interface LearningRecommendation {
  skill: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  resources: LearningResource[];
  estimatedTime: number; // hours
}

export interface LearningResource {
  type: 'tutorial' | 'documentation' | 'course' | 'practice' | 'project';
  title: string;
  url: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // minutes
  rating: number; // 0-5
}

export interface AchievementStatistics {
  totalAchievements: number;
  totalPoints: number;
  level: number;
  nextLevelProgress: number; // 0-1
  categories: Map<AchievementCategory, number>;
  recentAchievements: Achievement[];
  upcomingAchievements: UpcomingAchievement[];
}

export interface UpcomingAchievement {
  achievement: Achievement;
  progress: number; // 0-1
  requirements: string[];
  estimatedCompletion: Date;
}

export interface UserPermissions {
  features: FeaturePermission[];
  resources: ResourcePermission[];
  administrative: AdministrativePermission[];
  api: ApiPermission[];
}

export interface FeaturePermission {
  feature: string;
  allowed: boolean;
  restrictions: string[];
  expiresAt?: Date;
}

export interface ResourcePermission {
  resource: string;
  actions: string[];
  scope: 'own' | 'team' | 'organization' | 'all';
  conditions: PermissionCondition[];
}

export interface PermissionCondition {
  type: string;
  value: any;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface AdministrativePermission {
  permission: string;
  level: 'read' | 'write' | 'admin';
  scope: string[];
}

export interface ApiPermission {
  endpoint: string;
  methods: string[];
  rateLimit: RateLimit;
  scope: string[];
}

export interface RateLimit {
  requests: number;
  period: 'minute' | 'hour' | 'day';
  burst: number;
}