// API endpoints for authentication and user management
// These would typically be implemented in a separate backend service
// For now, these are TypeScript interfaces and mock implementations

export interface AuthAPI {
  // User authentication
  signUp(email: string, password: string, referralCode?: string): Promise<AuthResponse>;
  signIn(email: string, password: string): Promise<AuthResponse>;
  signOut(): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  resetPassword(email: string): Promise<void>;
  updatePassword(oldPassword: string, newPassword: string): Promise<void>;
  
  // OAuth providers
  signInWithProvider(provider: 'github' | 'google'): Promise<AuthResponse>;
  linkProvider(provider: 'github' | 'google'): Promise<void>;
  unlinkProvider(provider: 'github' | 'google'): Promise<void>;
  
  // User profile
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  uploadAvatar(file: File): Promise<string>;
  
  // Subscription management
  upgradeTier(tier: UserTier, paymentMethodId: string): Promise<Subscription>;
  cancelSubscription(): Promise<void>;
  getSubscriptionHistory(): Promise<Subscription[]>;
  updatePaymentMethod(paymentMethodId: string): Promise<void>;
  
  // Referrals
  getReferrals(): Promise<Referral[]>;
  createReferral(email: string): Promise<Referral>;
  validateReferralCode(code: string): Promise<boolean>;
}

export interface WebsiteAPI {
  // CRUD operations
  list(filters?: WebsiteFilters): Promise<Website[]>;
  get(id: string): Promise<Website>;
  create(data: CreateWebsiteData): Promise<Website>;
  update(id: string, updates: Partial<Website>): Promise<Website>;
  delete(id: string): Promise<void>;
  
  // Deployment
  deploy(id: string): Promise<DeploymentResult>;
  getDeploymentStatus(id: string): Promise<DeploymentStatus>;
  rollback(id: string, deploymentId: string): Promise<void>;
  
  // Analytics
  getAnalytics(id: string, timeRange: TimeRange): Promise<Analytics>;
  trackPageview(id: string, data: PageviewData): Promise<void>;
  exportAnalytics(id: string, format: 'csv' | 'json'): Promise<Blob>;
  
  // Custom domains
  addCustomDomain(id: string, domain: string): Promise<void>;
  removeCustomDomain(id: string): Promise<void>;
  verifyDomain(id: string): Promise<DomainVerification>;
  
  // Collaboration
  shareWebsite(id: string, email: string, role: 'viewer' | 'editor'): Promise<void>;
  removeCollaborator(id: string, userId: string): Promise<void>;
  getCollaborators(id: string): Promise<Collaborator[]>;
}

export interface AnalyticsAPI {
  // Real-time analytics
  getRealtimeVisitors(websiteId: string): Promise<RealtimeVisitor[]>;
  subscribeToAnalytics(websiteId: string, callback: (data: AnalyticsEvent) => void): () => void;
  
  // Historical data
  getPageviews(websiteId: string, timeRange: TimeRange): Promise<PageviewMetrics>;
  getTopPages(websiteId: string, limit: number): Promise<PageMetrics[]>;
  getReferrers(websiteId: string, limit: number): Promise<ReferrerMetrics[]>;
  getDeviceStats(websiteId: string): Promise<DeviceMetrics>;
  getGeographicData(websiteId: string): Promise<GeographicMetrics>;
  
  // User behavior
  getUserFlow(websiteId: string): Promise<UserFlow>;
  getHeatmap(websiteId: string, pageUrl: string): Promise<HeatmapData>;
  getSessionRecordings(websiteId: string, filters?: SessionFilters): Promise<SessionRecording[]>;
  
  // Goals and conversions
  createGoal(websiteId: string, goal: Goal): Promise<Goal>;
  getGoals(websiteId: string): Promise<Goal[]>;
  getConversionRate(websiteId: string, goalId: string): Promise<ConversionMetrics>;
}

// Type definitions
export interface AuthResponse {
  user: User;
  session: Session;
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  tier: UserTier;
  referralCode: string;
  websitesLimit: number;
  customDomainsLimit: number;
  monthlyPageviewsLimit: number;
  storageLimitMb: number;
  totalWebsitesCreated: number;
  totalPageviews: number;
  createdAt: string;
  updatedAt: string;
}

export type UserTier = 'free' | 'pro' | 'business' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  tier: UserTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  referredUserId?: string;
  status: 'pending' | 'completed' | 'expired';
  rewardGranted: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Website {
  id: string;
  userId: string;
  title: string;
  description?: string;
  repoUrl: string;
  subdomain?: string;
  customDomain?: string;
  generationMode: 'quick' | 'deep';
  template: string;
  tier: string;
  siteData: any;
  visuals?: any;
  customizations?: any;
  mcpConfig?: any;
  status: 'active' | 'building' | 'error' | 'suspended';
  buildError?: string;
  lastBuildAt?: string;
  pageviews: number;
  uniqueVisitors: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateWebsiteData {
  title: string;
  description?: string;
  repoUrl: string;
  subdomain?: string;
  generationMode: 'quick' | 'deep';
  template: string;
  tier: string;
  siteData: any;
  visuals?: any;
  customizations?: any;
}

export interface WebsiteFilters {
  status?: Website['status'];
  tier?: string;
  search?: string;
  sortBy?: 'created' | 'updated' | 'pageviews';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DeploymentResult {
  id: string;
  websiteId: string;
  status: 'pending' | 'building' | 'deployed' | 'failed';
  url?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface DeploymentStatus {
  id: string;
  status: DeploymentResult['status'];
  progress: number;
  logs: string[];
}

export interface Analytics {
  websiteId: string;
  timeRange: TimeRange;
  pageviews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ url: string; views: number }>;
  topReferrers: Array<{ source: string; visits: number }>;
  devices: { desktop: number; mobile: number; tablet: number };
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface PageviewData {
  url: string;
  referrer?: string;
  userAgent: string;
  ipAddress?: string;
  sessionId: string;
}

export interface DomainVerification {
  verified: boolean;
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
  }>;
}

export interface Collaborator {
  id: string;
  userId: string;
  email: string;
  role: 'viewer' | 'editor';
  addedAt: string;
}

// Additional types for analytics
export interface RealtimeVisitor {
  id: string;
  location: string;
  device: string;
  currentPage: string;
  duration: number;
}

export interface AnalyticsEvent {
  type: 'pageview' | 'click' | 'scroll' | 'custom';
  data: any;
  timestamp: string;
}

export interface PageviewMetrics {
  total: number;
  unique: number;
  series: Array<{ date: string; views: number }>;
}

export interface PageMetrics {
  url: string;
  views: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface ReferrerMetrics {
  source: string;
  visits: number;
  conversionRate: number;
}

export interface DeviceMetrics {
  desktop: { count: number; percentage: number };
  mobile: { count: number; percentage: number };
  tablet: { count: number; percentage: number };
}

export interface GeographicMetrics {
  countries: Array<{ code: string; name: string; visits: number }>;
  cities: Array<{ name: string; country: string; visits: number }>;
}

export interface UserFlow {
  nodes: Array<{ id: string; url: string; visits: number }>;
  edges: Array<{ source: string; target: string; weight: number }>;
}

export interface HeatmapData {
  clicks: Array<{ x: number; y: number; count: number }>;
  scrollDepth: Array<{ depth: number; percentage: number }>;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  duration: number;
  events: Array<{ type: string; data: any; timestamp: number }>;
}

export interface SessionFilters {
  minDuration?: number;
  maxDuration?: number;
  device?: string;
  country?: string;
  dateRange?: TimeRange;
}

export interface Goal {
  id: string;
  name: string;
  type: 'pageview' | 'event' | 'duration';
  target: string | number;
  value?: number;
}

export interface ConversionMetrics {
  conversions: number;
  conversionRate: number;
  value: number;
  series: Array<{ date: string; conversions: number; rate: number }>;
}