// AegntiX Comprehensive Type Definitions
// Elite-tier TypeScript interfaces for the AI orchestration platform

// ============================================================================
// Core Entity Types
// ============================================================================

export interface UUID extends String {
  readonly _brand: 'UUID';
}

export interface Timestamp extends Number {
  readonly _brand: 'Timestamp';
}

export interface PersonalityScore extends Number {
  readonly _brand: 'PersonalityScore';
  readonly _range: '0.0-1.0';
}

// ============================================================================
// Agent System Types
// ============================================================================

export interface PersonalityVector {
  readonly traits: Record<string, PersonalityScore>;
  readonly consistencyThreshold: PersonalityScore;
  readonly evolutionRate: PersonalityScore;
  readonly lastUpdated: Timestamp;
}

export interface AgentGoal {
  readonly id: UUID;
  readonly description: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  readonly progress: PersonalityScore;
}

export interface AgentMemory {
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly type: 'interaction' | 'observation' | 'decision' | 'context_injection';
  readonly content: string;
  readonly scenarioContext: UUID;
  readonly emotionalImpact: PersonalityScore;
  readonly relevanceScore: PersonalityScore;
}

export interface Agent {
  readonly id: UUID;
  readonly scenarioId: UUID;
  readonly role: string;
  readonly name: string;
  readonly personality: PersonalityVector;
  readonly goals: AgentGoal[];
  readonly memory: AgentMemory[];
  readonly currentState: AgentState;
  readonly createdAt: Timestamp;
  readonly lastActiveAt: Timestamp;
}

export interface AgentState {
  readonly mood: PersonalityScore;
  readonly energy: PersonalityScore;
  readonly focus: PersonalityScore;
  readonly confidence: PersonalityScore;
  readonly stressLevel: PersonalityScore;
  readonly lastAction: string;
  readonly isActive: boolean;
  readonly contextAwareness: Record<string, PersonalityScore>;
}

export interface AgentAction {
  readonly id: UUID;
  readonly agentId: UUID;
  readonly scenarioId: UUID;
  readonly type: 'speech' | 'thought' | 'decision' | 'observation' | 'emotion';
  readonly content: string;
  readonly timestamp: Timestamp;
  readonly confidence: PersonalityScore;
  readonly targetAgents?: UUID[];
  readonly contextReferences?: UUID[];
}

// ============================================================================
// Scenario System Types
// ============================================================================

export interface WorldState {
  readonly environment: Record<string, any>;
  readonly constraints: string[];
  readonly availableResources: Record<string, number>;
  readonly timeContext: string;
  readonly externalFactors: Record<string, any>;
}

export interface ScenarioConfig {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly estimatedDuration: number; // minutes
  readonly maxAgents: number;
  readonly worldState: WorldState;
  readonly successCriteria: string[];
  readonly failureConditions: string[];
}

export interface ScenarioMetrics {
  readonly engagement: PersonalityScore;
  readonly coherence: PersonalityScore;
  readonly conflictLevel: PersonalityScore;
  readonly emergentBehaviors: number;
  readonly userInterventions: number;
  readonly averageResponseTime: number;
  readonly totalInteractions: number;
}

export interface Scenario {
  readonly id: UUID;
  readonly config: ScenarioConfig;
  readonly state: ScenarioState;
  readonly agents: UUID[];
  readonly timeline: TimelineState;
  readonly metrics: ScenarioMetrics;
  readonly createdAt: Timestamp;
  readonly startedAt?: Timestamp;
  readonly endedAt?: Timestamp;
  readonly createdBy?: UUID; // User ID
}

export type ScenarioState = 
  | 'created' 
  | 'initializing' 
  | 'running' 
  | 'paused' 
  | 'branching' 
  | 'completed' 
  | 'failed' 
  | 'terminated';

// ============================================================================
// Timeline System Types
// ============================================================================

export interface TimelineEvent {
  readonly id: UUID;
  readonly scenarioId: UUID;
  readonly timestamp: Timestamp;
  readonly agentId?: UUID;
  readonly eventType: EventType;
  readonly data: any;
  readonly branchId?: UUID;
  readonly sequenceNumber: number;
  readonly causedBy?: UUID; // Previous event that caused this
  readonly affects?: UUID[]; // Agents affected by this event
}

export type EventType = 
  | 'scenario_started'
  | 'scenario_paused'
  | 'scenario_resumed'
  | 'agent_action'
  | 'agent_created'
  | 'context_injected'
  | 'timeline_branched'
  | 'user_intervention'
  | 'system_event';

export interface TimelineBranch {
  readonly id: UUID;
  readonly scenarioId: UUID;
  readonly parentBranchId?: UUID;
  readonly branchPoint: Timestamp;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: Timestamp;
  readonly createdBy?: UUID;
  readonly isActive: boolean;
  readonly divergenceScore: PersonalityScore;
}

export interface TimelineState {
  readonly currentTime: Timestamp;
  readonly activeBranch: UUID;
  readonly availableBranches: UUID[];
  readonly eventCount: number;
  readonly lastEventId: UUID;
  readonly branchingEnabled: boolean;
  readonly maxBranches: number;
}

export interface TimelineComparison {
  readonly branch1: UUID;
  readonly branch2: UUID;
  readonly divergencePoint: Timestamp;
  readonly keyDifferences: string[];
  readonly similarityScore: PersonalityScore;
  readonly significantEvents: UUID[];
  readonly outcomeComparison: Record<string, any>;
}

// ============================================================================
// Communication System Types
// ============================================================================

export interface WebSocketMessage {
  readonly type: MessageType;
  readonly data: any;
  readonly timestamp: Timestamp;
  readonly requestId?: UUID;
  readonly userId?: UUID;
  readonly scenarioId?: UUID;
}

export type MessageType = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'scenario_created'
  | 'scenario_started'
  | 'scenario_paused'
  | 'scenario_resumed'
  | 'scenario_terminated'
  | 'agent_action'
  | 'timeline_branched'
  | 'context_injected'
  | 'metrics_updated'
  | 'user_intervention';

export interface ClientConnection {
  readonly id: UUID;
  readonly websocket: any; // WebSocket instance
  readonly connectedAt: Timestamp;
  readonly lastActivity: Timestamp;
  readonly subscribedScenarios: Set<UUID>;
  readonly userId?: UUID;
  readonly isActive: boolean;
}

// ============================================================================
// AI Integration Types
// ============================================================================

export interface AIModelConfig {
  readonly provider: 'openrouter' | 'claude' | 'local';
  readonly model: string;
  readonly apiKey?: string;
  readonly baseURL?: string;
  readonly maxTokens: number;
  readonly temperature: PersonalityScore;
  readonly topP?: PersonalityScore;
  readonly presencePenalty?: PersonalityScore;
  readonly frequencyPenalty?: PersonalityScore;
}

export interface AIResponse {
  readonly content: string;
  readonly confidence: PersonalityScore;
  readonly reasoning?: string;
  readonly tokenUsage: {
    readonly prompt: number;
    readonly completion: number;
    readonly total: number;
  };
  readonly latency: number;
  readonly model: string;
  readonly timestamp: Timestamp;
}

export interface ContextInjection {
  readonly id: UUID;
  readonly targetAgent: UUID;
  readonly content: string;
  readonly type: 'information' | 'instruction' | 'constraint' | 'goal_update';
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly timestamp: Timestamp;
  readonly injectedBy?: UUID;
  readonly processed: boolean;
  readonly impact?: PersonalityScore;
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseConfig {
  readonly path: string;
  readonly maxConnections: number;
  readonly busyTimeout: number;
  readonly journalMode: 'WAL' | 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'OFF';
  readonly synchronous: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
}

export interface QueryResult<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly affectedRows?: number;
  readonly lastInsertRowid?: number;
  readonly executionTime: number;
}

// ============================================================================
// Error and Performance Types
// ============================================================================

export interface AegntiXError extends Error {
  readonly component: string;
  readonly operation: string;
  readonly context?: any;
  readonly timestamp: Timestamp;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recoverable: boolean;
}

export interface PerformanceMetric {
  readonly operation: string;
  readonly component: string;
  readonly duration: number;
  readonly timestamp: Timestamp;
  readonly success: boolean;
  readonly metadata?: Record<string, any>;
}

export interface SystemHealth {
  readonly uptime: number;
  readonly memoryUsage: number;
  readonly cpuUsage: number;
  readonly activeConnections: number;
  readonly activeScenarios: number;
  readonly totalAgents: number;
  readonly errorRate: PersonalityScore;
  readonly averageResponseTime: number;
  readonly lastHealthCheck: Timestamp;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  readonly port: number;
  readonly host: string;
  readonly cors: {
    readonly enabled: boolean;
    readonly origins: string[];
  };
  readonly rateLimit: {
    readonly enabled: boolean;
    readonly maxRequests: number;
    readonly windowMs: number;
  };
  readonly websocket: {
    readonly maxConnections: number;
    readonly heartbeatInterval: number;
    readonly timeout: number;
  };
}

export interface AegntiXConfig {
  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly ai: AIModelConfig;
  readonly logging: {
    readonly level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    readonly maxLogs: number;
    readonly exportEnabled: boolean;
  };
  readonly performance: {
    readonly metricsEnabled: boolean;
    readonly healthCheckInterval: number;
    readonly maxTimelineEvents: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E = AegntiXError> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export type AsyncResult<T, E = AegntiXError> = Promise<Result<T, E>>;

export interface Paginated<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

// Type guards for runtime type checking
export function isUUID(value: any): value is UUID {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isPersonalityScore(value: any): value is PersonalityScore {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

export function isTimestamp(value: any): value is Timestamp {
  return typeof value === 'number' && value > 0;
}

// Type utilities for creating instances
export function createUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

export function createTimestamp(): Timestamp {
  return Date.now() as Timestamp;
}

export function createPersonalityScore(value: number): PersonalityScore {
  if (value < 0 || value > 1) {
    throw new Error(`PersonalityScore must be between 0 and 1, got ${value}`);
  }
  return value as PersonalityScore;
}