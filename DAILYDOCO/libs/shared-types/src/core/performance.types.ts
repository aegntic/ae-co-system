// Performance Monitoring and Benchmarking Types

export interface PerformanceMonitor {
  id: string;
  name: string;
  type: MonitorType;
  status: MonitorStatus;
  configuration: MonitorConfiguration;
  metrics: PerformanceMetrics[];
  thresholds: PerformanceThreshold[];
  alerts: PerformanceAlert[];
  history: PerformanceHistory;
}

export enum MonitorType {
  SYSTEM = 'system',
  APPLICATION = 'application',
  PROCESS = 'process',
  NETWORK = 'network',
  STORAGE = 'storage',
  GPU = 'gpu',
  USER_EXPERIENCE = 'user_experience'
}

export enum MonitorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface MonitorConfiguration {
  interval: number; // milliseconds
  enabled: boolean;
  autoStart: boolean;
  persistence: boolean;
  aggregation: AggregationConfig;
  sampling: SamplingConfig;
}

export interface AggregationConfig {
  method: 'average' | 'sum' | 'min' | 'max' | 'median' | 'percentile';
  window: number; // seconds
  retention: number; // days
}

export interface SamplingConfig {
  rate: number; // 0-1
  adaptive: boolean;
  maxSamples: number;
  bufferSize: number;
}

export interface PerformanceMetrics {
  timestamp: Date;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  gpu?: GpuMetrics;
  storage: StorageMetrics;
  network: NetworkMetrics;
  application: ApplicationMetrics;
  userExperience: UserExperienceMetrics;
}

export interface CpuMetrics {
  usage: number; // percentage (0-100)
  loadAverage: number[];
  cores: CoreMetrics[];
  temperature?: number; // celsius
  frequency?: number; // MHz
  processes: ProcessMetrics[];
}

export interface CoreMetrics {
  id: number;
  usage: number; // percentage
  frequency: number; // MHz
  temperature?: number; // celsius
}

export interface ProcessMetrics {
  pid: number;
  name: string;
  cpuUsage: number; // percentage
  memoryUsage: number; // bytes
  priority: number;
  threads: number;
  handles?: number;
}

export interface MemoryMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  available: number; // bytes
  cached: number; // bytes
  buffered: number; // bytes
  swap: SwapMetrics;
  processes: ProcessMemoryMetrics[];
}

export interface SwapMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
}

export interface ProcessMemoryMetrics {
  pid: number;
  name: string;
  workingSet: number; // bytes
  virtualMemory: number; // bytes
  sharedMemory: number; // bytes
  privateMemory: number; // bytes
}

export interface GpuMetrics {
  devices: GpuDeviceMetrics[];
  totalMemory: number; // bytes
  usedMemory: number; // bytes
  temperature: number; // celsius
  powerUsage: number; // watts
}

export interface GpuDeviceMetrics {
  id: string;
  name: string;
  usage: number; // percentage
  memory: GpuMemoryMetrics;
  temperature: number; // celsius
  fanSpeed: number; // percentage
  powerUsage: number; // watts
  processes: GpuProcessMetrics[];
}

export interface GpuMemoryMetrics {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
}

export interface GpuProcessMetrics {
  pid: number;
  name: string;
  memoryUsage: number; // bytes
  gpuUsage: number; // percentage
}

export interface StorageMetrics {
  devices: StorageDeviceMetrics[];
  totalSpace: number; // bytes
  usedSpace: number; // bytes
  freeSpace: number; // bytes
  iops: IOMetrics;
}

export interface StorageDeviceMetrics {
  device: string;
  mountPoint: string;
  fileSystem: string;
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  usage: number; // percentage
  iops: IOMetrics;
  temperature?: number; // celsius
}

export interface IOMetrics {
  readOps: number; // operations per second
  writeOps: number; // operations per second
  readBytes: number; // bytes per second
  writeBytes: number; // bytes per second
  latency: IOLatencyMetrics;
}

export interface IOLatencyMetrics {
  read: number; // milliseconds
  write: number; // milliseconds
  average: number; // milliseconds
  percentiles: LatencyPercentiles;
}

export interface LatencyPercentiles {
  p50: number; // milliseconds
  p90: number; // milliseconds
  p95: number; // milliseconds
  p99: number; // milliseconds
}

export interface NetworkMetrics {
  interfaces: NetworkInterfaceMetrics[];
  totalBandwidth: BandwidthMetrics;
  connections: ConnectionMetrics;
  latency: NetworkLatencyMetrics;
}

export interface NetworkInterfaceMetrics {
  name: string;
  type: string;
  status: 'up' | 'down';
  bandwidth: BandwidthMetrics;
  packets: PacketMetrics;
  errors: ErrorMetrics;
}

export interface BandwidthMetrics {
  received: number; // bytes per second
  sent: number; // bytes per second
  total: number; // bytes per second
  utilization: number; // percentage
}

export interface PacketMetrics {
  received: number; // packets per second
  sent: number; // packets per second
  dropped: number; // packets per second
  errors: number; // packets per second
}

export interface ErrorMetrics {
  receiveErrors: number;
  transmitErrors: number;
  collisions: number;
  retransmissions: number;
}

export interface ConnectionMetrics {
  established: number;
  active: number;
  failed: number;
  timeouts: number;
}

export interface NetworkLatencyMetrics {
  local: number; // milliseconds
  internet: number; // milliseconds
  dns: number; // milliseconds
  jitter: number; // milliseconds
}

export interface ApplicationMetrics {
  dailydoco: DailyDocoMetrics;
  dependencies: DependencyMetrics[];
  errors: ApplicationErrorMetrics;
  performance: ApplicationPerformanceMetrics;
}

export interface DailyDocoMetrics {
  version: string;
  uptime: number; // seconds
  activeProjects: number;
  captureStatus: CaptureStatus;
  processingQueue: QueueMetrics;
  storage: ApplicationStorageMetrics;
  ai: AIPerformanceMetrics;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageWaitTime: number; // seconds
  averageProcessingTime: number; // seconds
}

export interface ApplicationStorageMetrics {
  totalProjects: number;
  totalVideos: number;
  totalSize: number; // bytes
  averageFileSize: number; // bytes
  compressionRatio: number;
  cleanupNeeded: boolean;
}

export interface AIPerformanceMetrics {
  models: ModelPerformanceMetrics[];
  requests: AIRequestMetrics;
  costs: AICostMetrics;
  accuracy: AIAccuracyMetrics;
}

export interface AIRequestMetrics {
  total: number;
  successful: number;
  failed: number;
  timeout: number;
  averageLatency: number; // milliseconds
  throughput: number; // requests per second
}

export interface AICostMetrics {
  totalCost: number; // USD
  costPerRequest: number; // USD
  tokenUsage: TokenUsageMetrics;
  efficiency: number; // cost per quality unit
}

export interface TokenUsageMetrics {
  input: number;
  output: number;
  total: number;
  averagePerRequest: number;
}

export interface AIAccuracyMetrics {
  overall: number; // 0-1
  byTask: Map<string, number>; // task type -> accuracy
  userSatisfaction: number; // 0-1
  corrections: number;
}

export interface DependencyMetrics {
  name: string;
  version: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number; // milliseconds
  errorRate: number; // 0-1
  availability: number; // 0-1
}

export interface ApplicationErrorMetrics {
  total: number;
  byType: Map<string, number>;
  bySeverity: Map<string, number>;
  recent: ErrorSummary[];
  resolved: number;
  unresolved: number;
}

export interface ErrorSummary {
  type: string;
  message: string;
  count: number;
  lastOccurrence: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApplicationPerformanceMetrics {
  startupTime: number; // seconds
  responseTime: PerformanceResponseTime;
  throughput: ThroughputMetrics;
  reliability: ReliabilityMetrics;
}

export interface PerformanceResponseTime {
  average: number; // milliseconds
  median: number; // milliseconds
  p95: number; // milliseconds
  p99: number; // milliseconds
  max: number; // milliseconds
}

export interface ThroughputMetrics {
  operations: number; // operations per second
  videos: number; // videos processed per hour
  data: number; // bytes processed per second
}

export interface ReliabilityMetrics {
  uptime: number; // percentage
  mtbf: number; // mean time between failures (hours)
  mttr: number; // mean time to recovery (minutes)
  sla: number; // service level agreement percentage
}

export interface UserExperienceMetrics {
  responsiveness: ResponsivenessMetrics;
  stability: StabilityMetrics;
  satisfaction: SatisfactionMetrics;
  efficiency: EfficiencyMetrics;
}

export interface ResponsivenessMetrics {
  uiResponseTime: number; // milliseconds
  videoPreviewLatency: number; // milliseconds
  exportStartTime: number; // seconds
  searchResponseTime: number; // milliseconds
}

export interface StabilityMetrics {
  crashes: number;
  freezes: number;
  unexpectedBehavior: number;
  dataLoss: number;
  recoveryTime: number; // seconds
}

export interface SatisfactionMetrics {
  userRating: number; // 1-5
  nps: number; // Net Promoter Score (-100 to 100)
  csat: number; // Customer Satisfaction (0-1)
  churnRate: number; // 0-1
}

export interface EfficiencyMetrics {
  taskCompletionTime: number; // seconds
  clicksPerTask: number;
  errorRate: number; // 0-1
  learningCurve: number; // time to proficiency
}

export interface PerformanceThreshold {
  metric: string;
  condition: ThresholdCondition;
  value: number;
  severity: AlertSeverity;
  duration: number; // seconds before triggering
  enabled: boolean;
}

export interface ThresholdCondition {
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  aggregation: 'current' | 'average' | 'max' | 'min';
  window: number; // seconds
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  metric: string;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  status: AlertStatus;
  actions: AlertAction[];
  acknowledgment?: AlertAcknowledgment;
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export interface AlertAction {
  type: 'email' | 'slack' | 'webhook' | 'log' | 'auto_remediation';
  configuration: Record<string, any>;
  executed: boolean;
  result?: string;
}

export interface AlertAcknowledgment {
  user: string;
  timestamp: Date;
  comment?: string;
}

export interface PerformanceHistory {
  retention: number; // days
  granularity: HistoryGranularity[];
  summaries: PerformanceSummary[];
  trends: PerformanceTrend[];
  reports: PerformanceReport[];
}

export interface HistoryGranularity {
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month';
  retention: number; // count
  aggregation: AggregationConfig;
}

export interface PerformanceSummary {
  period: TimePeriod;
  metrics: MetricSummary[];
  availability: number; // 0-1
  incidents: IncidentSummary[];
  improvements: ImprovementSummary[];
}

export interface TimePeriod {
  start: Date;
  end: Date;
  type: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface MetricSummary {
  name: string;
  average: number;
  min: number;
  max: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
}

export interface IncidentSummary {
  count: number;
  totalDuration: number; // minutes
  averageDuration: number; // minutes
  severity: Map<AlertSeverity, number>;
  resolved: number;
  unresolved: number;
}

export interface ImprovementSummary {
  metric: string;
  improvement: number; // percentage
  baseline: number;
  current: number;
  attribution: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // percentage change
  confidence: number; // 0-1
  timeframe: number; // days
  factors: TrendFactor[];
}

export interface TrendFactor {
  factor: string;
  correlation: number; // -1 to 1
  impact: number; // 0-1
  confidence: number; // 0-1
}

export interface PerformanceReport {
  id: string;
  type: ReportType;
  period: TimePeriod;
  format: ReportFormat;
  content: ReportContent;
  generated: Date;
  recipients: string[];
}

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  INCIDENT = 'incident',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  HTML = 'html',
  CSV = 'csv',
  DASHBOARD = 'dashboard'
}

export interface ReportContent {
  summary: PerformanceSummary;
  details: ReportSection[];
  recommendations: Recommendation[];
  attachments: ReportAttachment[];
}

export interface ReportSection {
  title: string;
  type: 'metrics' | 'charts' | 'table' | 'text' | 'alert_summary';
  content: any;
  order: number;
}

export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'cost' | 'security';
  title: string;
  description: string;
  impact: string;
  effort: string;
  timeline: string;
  resources: string[];
}

export interface ReportAttachment {
  name: string;
  type: string;
  size: number; // bytes
  url: string;
  description?: string;
}

// Benchmarking Types

export interface PerformanceBenchmark {
  id: string;
  name: string;
  description: string;
  category: BenchmarkCategory;
  tests: BenchmarkTest[];
  configuration: BenchmarkConfiguration;
  results: BenchmarkResult[];
  baselines: BenchmarkBaseline[];
}

export enum BenchmarkCategory {
  CAPTURE = 'capture',
  PROCESSING = 'processing',
  AI = 'ai',
  STORAGE = 'storage',
  NETWORK = 'network',
  UI = 'ui',
  INTEGRATION = 'integration'
}

export interface BenchmarkTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  parameters: TestParameters;
  metrics: string[];
  duration: number; // seconds
  iterations: number;
}

export enum TestType {
  THROUGHPUT = 'throughput',
  LATENCY = 'latency',
  SCALABILITY = 'scalability',
  RELIABILITY = 'reliability',
  RESOURCE_USAGE = 'resource_usage',
  QUALITY = 'quality'
}

export interface TestParameters {
  [key: string]: any;
  concurrency?: number;
  dataSize?: number;
  complexity?: string;
  quality?: string;
}

export interface BenchmarkConfiguration {
  environment: EnvironmentConfig;
  hardware: HardwareConfig;
  software: SoftwareConfig;
  network: NetworkConfig;
}

export interface EnvironmentConfig {
  os: string;
  version: string;
  architecture: string;
  timezone: string;
  locale: string;
}

export interface HardwareConfig {
  cpu: CpuConfig;
  memory: MemoryConfig;
  storage: StorageConfig;
  gpu?: GpuConfig;
}

export interface CpuConfig {
  model: string;
  cores: number;
  threads: number;
  frequency: number; // MHz
  cache: CacheConfig[];
}

export interface CacheConfig {
  level: number;
  size: number; // bytes
  type: 'instruction' | 'data' | 'unified';
}

export interface MemoryConfig {
  total: number; // bytes
  type: string;
  speed: number; // MHz
  channels: number;
}

export interface StorageConfig {
  devices: StorageDeviceConfig[];
  raid?: RaidConfig;
}

export interface StorageDeviceConfig {
  type: 'hdd' | 'ssd' | 'nvme' | 'network';
  model: string;
  capacity: number; // bytes
  interface: string;
  speed: number; // MB/s
}

export interface RaidConfig {
  level: string;
  devices: number;
  capacity: number; // bytes
}

export interface GpuConfig {
  model: string;
  memory: number; // bytes
  cores: number;
  frequency: number; // MHz
  driver: string;
}

export interface SoftwareConfig {
  dailydoco: string; // version
  dependencies: DependencyVersion[];
  runtime: RuntimeConfig;
}

export interface DependencyVersion {
  name: string;
  version: string;
  type: 'system' | 'runtime' | 'library';
}

export interface RuntimeConfig {
  node?: string; // version
  rust?: string; // version
  python?: string; // version
  ffmpeg?: string; // version
}

export interface NetworkConfig {
  bandwidth: number; // Mbps
  latency: number; // milliseconds
  jitter: number; // milliseconds
  packetLoss: number; // percentage
}

export interface BenchmarkResult {
  id: string;
  benchmarkId: string;
  timestamp: Date;
  configuration: BenchmarkConfiguration;
  testResults: TestResult[];
  summary: BenchmarkSummary;
  comparison: BenchmarkComparison[];
}

export interface TestResult {
  testId: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // seconds
  iterations: number;
  metrics: TestMetric[];
  errors: TestError[];
}

export interface TestMetric {
  name: string;
  value: number;
  unit: string;
  aggregation: 'average' | 'sum' | 'min' | 'max' | 'median';
  samples: number[];
}

export interface TestError {
  type: string;
  message: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface BenchmarkSummary {
  score: number; // overall performance score
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface BenchmarkComparison {
  baseline: string;
  improvement: number; // percentage
  regression: number; // percentage
  significant: boolean;
  details: ComparisonDetail[];
}

export interface ComparisonDetail {
  metric: string;
  baseline: number;
  current: number;
  change: number; // percentage
  significant: boolean;
}

export interface BenchmarkBaseline {
  id: string;
  name: string;
  description: string;
  type: 'hardware' | 'software' | 'configuration' | 'industry';
  values: BaselineValue[];
  createdAt: Date;
  validUntil?: Date;
}

export interface BaselineValue {
  metric: string;
  value: number;
  percentile: number; // 0-100
  source: string;
  confidence: number; // 0-1
}