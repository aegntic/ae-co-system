// AegntiX Comprehensive Type Definitions
// Elite-tier TypeScript interfaces for the AI orchestration platform

// ============================================================================
// Core Entity Types
// ============================================================================

export type UUID = string & { readonly _brand: 'UUID' };

export type Timestamp = number & { readonly _brand: 'Timestamp' };

export type PersonalityScore = number & {
  readonly _brand: 'PersonalityScore';
  readonly _range: '0.0-1.0';
};

// ============================================================================
// Agent System Types
// ============================================================================

export interface PersonalityTraits {
    openness: PersonalityScore; // How open to new experiences
    conscientiousness: PersonalityScore; // How organized and dependable
    extraversion: PersonalityScore; // How outgoing and sociable
    agreeableness: PersonalityScore; // How cooperative and empathetic
    neuroticism: PersonalityScore; // How prone to stress and negative emotions
    // Add any other custom traits relevant to AegntiX
    creativity?: PersonalityScore;
    riskAversion?: PersonalityScore;
}

export interface PersonalityVector {
  readonly traits: PersonalityTraits;
  readonly consistencyThreshold: PersonalityScore; // How much traits can vary before behavior is inconsistent
  readonly evolutionRate: PersonalityScore; // How quickly personality adapts to experiences
  readonly lastUpdated: Timestamp;
}

export interface AgentGoal {
  readonly id: UUID;
  readonly description: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly status: 'pending' | 'in_progress' | 'completed' | 'abandoned';
  readonly progress: PersonalityScore; // 0.0 to 1.0
  readonly relatedMetrics?: Record<string, number>; // e.g. { "lines_of_code_written": 150 }
  readonly deadline?: Timestamp;
}

export interface AgentMemory {
  readonly id: UUID;
  readonly timestamp: Timestamp;
  readonly type: 'interaction' | 'observation' | 'decision' | 'context_injection' | 'learning';
  readonly content: string; // Could be text, or JSON string for structured memory
  readonly scenarioContext: UUID; // ID of the scenario this memory relates to
  readonly emotionalImpact?: PersonalityScore; // Subjective impact on the agent
  readonly relevanceScore: PersonalityScore; // How relevant this memory is to current goals/context
  readonly relatedEntities?: UUID[]; // Link to other agents, objects, concepts
}

export interface Agent {
  readonly id: UUID;
  readonly scenarioId: UUID;
  readonly role: string; // e.g., "Software Developer", "Project Manager"
  readonly name: string; // e.g., "Alice", "Bob"
  readonly personality: PersonalityVector;
  readonly goals: AgentGoal[];
  readonly memory: AgentMemory[]; // Could be a more complex structure or link to a memory system
  readonly currentState: AgentState;
  readonly capabilities?: string[]; // List of skills or tools the agent can use
  readonly createdAt: Timestamp;
  readonly lastActiveAt: Timestamp;
}

export interface AgentState {
  readonly mood?: PersonalityScore; // e.g., happy, sad, stressed (0-1 scale)
  readonly energy?: PersonalityScore; // Current energy level
  readonly focus?: PersonalityScore; // Current focus level
  readonly confidence?: PersonalityScore;
  readonly stressLevel?: PersonalityScore;
  readonly lastAction?: string; // Description or ID of the last action taken
  readonly isActive: boolean; // Is the agent currently processing/active
  readonly currentTask?: UUID; // ID of the goal or sub-task being worked on
  readonly contextAwareness?: Record<string, PersonalityScore>; // How aware of certain context elements
  readonly knowledgeGraph?: any; // Simplified view or access to its part of a knowledge graph
}

export interface AgentAction {
  readonly id: UUID;
  readonly agentId: UUID;
  readonly scenarioId: UUID;
  readonly type: 'speech' | 'thought' | 'decision' | 'observation' | 'emotion' | 'tool_use' | 'api_call';
  readonly content: string; // Text of speech/thought, or details of decision/observation
  readonly timestamp: Timestamp;
  readonly confidence?: PersonalityScore; // Confidence in this action/decision
  readonly targetAgents?: UUID[]; // If action is directed at other agents
  readonly contextReferences?: UUID[]; // IDs of memory items or events that informed this action
  readonly toolUsed?: string; // If type is 'tool_use'
  readonly parameters?: Record<string, any>; // Parameters for tool_use or api_call
  readonly result?: any; // Result of tool_use or api_call
}

// ============================================================================
// Scenario System Types
// ============================================================================

export interface WorldState {
  readonly environment: Record<string, any>; // e.g., { "weather": "sunny", "stock_market": "up" }
  readonly constraints: string[]; // Rules or limitations
  readonly availableResources: Record<string, number | string>; // e.g., { "budget": 100000, "team_members": 5 }
  readonly timeContext: string; // e.g., "Q3 2024", "Sprint 5"
  readonly externalFactors?: Record<string, any>; // Unpredictable elements
}

export interface ScenarioConfig {
  readonly name: string;
  readonly description: string;
  readonly category?: string; // e.g., "Software Development", "Business Strategy"
  readonly difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly estimatedDuration?: number; // minutes
  readonly maxAgents?: number;
  readonly worldState: WorldState;
  readonly agents: Omit<Agent, 'id' | 'scenarioId' | 'memory' | 'currentState' | 'createdAt' | 'lastActiveAt'>[]; // Agent configs
  readonly successCriteria?: string[];
  readonly failureConditions?: string[];
  readonly learningObjectives?: string[];
}

export interface ScenarioMetrics {
  readonly engagement?: PersonalityScore;
  readonly coherence?: PersonalityScore; // How logically consistent the scenario is
  readonly conflictLevel?: PersonalityScore;
  readonly emergentBehaviors?: number; // Count of unexpected but interesting behaviors
  readonly userInterventions?: number; // How many times a human user had to step in
  readonly averageResponseTime?: number; // For agent actions
  readonly totalInteractions?: number;
  readonly goalAchievementRate?: PersonalityScore;
}

export interface Scenario {
  readonly id: UUID;
  readonly config: ScenarioConfig; // Contains initial setup like agents, world state
  state: ScenarioState; // Mutable state of the scenario itself
  agents: Agent[]; // Live agent instances within this scenario
  timeline: TimelineState; // Current state of the timeline for this scenario
  metrics: ScenarioMetrics;
  readonly createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  readonly createdBy?: UUID; // User ID if applicable
  currentTime: Timestamp; // Simulation current time
  events: TimelineEvent[]; // Log of events in the current primary timeline of scenario
  branches: TimelineBranch[]; // Information about alternative timelines
  updatedAt: Timestamp;
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
  readonly timestamp: Timestamp; // Simulation time of the event
  readonly agentId?: UUID; // Agent causing or primarily involved in the event
  readonly eventType: EventType;
  readonly data: any; // Specific data for the event type, should be serializable
  readonly branchId?: UUID; // If this event belongs to a specific branch
  readonly sequenceNumber: number; // For ordering events at the same timestamp
  readonly causedBy?: UUID; // ID of the event that directly led to this one
  readonly affects?: UUID[]; // IDs of agents or entities affected by this event
}

export type EventType =
  | 'scenario_started'
  | 'scenario_paused'
  | 'scenario_resumed'
  | 'scenario_ended'
  | 'agent_action' // Generic agent action
  | 'agent_created'
  | 'agent_updated' // e.g. state change, goal update
  | 'context_injected'
  | 'timeline_branched'
  | 'user_intervention'
  | 'system_event' // e.g. error, resource limit reached
  | 'goal_achieved'
  | 'milestone_reached';

export interface TimelineBranch {
  readonly id: UUID;
  readonly scenarioId: UUID;
  readonly parentBranchId?: UUID; // Undefined for the main timeline
  readonly branchPoint: Timestamp; // Simulation time at which this branch diverged
  name: string; // User-friendly name for the branch
  description?: string;
  readonly createdAt: Timestamp; // Real-world time of branch creation
  readonly createdBy?: UUID; // User or system that created the branch
  isActive: boolean; // Whether this branch is currently the active one for new events
  divergenceScore?: PersonalityScore; // How much this branch differs from its parent
  metadata?: Record<string, any>; // For storing additional info about the branch
}

export interface TimelineState {
  currentTime: Timestamp;
  activeBranch: UUID; // ID of the currently active branch
  availableBranches: TimelineBranch[]; // List of all branches for this scenario
  eventCount: number;
  lastEventId?: UUID;
  branchingEnabled: boolean;
  maxBranches?: number;
}

export interface TimelineComparison {
  readonly branch1: UUID;
  readonly branch2: UUID;
  readonly divergencePoint: Timestamp;
  readonly keyDifferences: string[]; // Descriptions of major differences
  readonly similarityScore: PersonalityScore;
  readonly significantEvents: { branch1Events: UUID[], branch2Events: UUID[] };
  readonly outcomeComparison?: Record<string, any>; // Comparison of end-state if applicable
}

// ============================================================================
// Communication System Types (e.g., WebSockets)
// ============================================================================

export interface WebSocketMessage {
  readonly type: MessageType;
  readonly data: any;
  readonly timestamp: Timestamp;
  readonly requestId?: UUID; // For tracking request-response pairs
  readonly userId?: UUID; // If user-specific
  readonly scenarioId?: UUID; // If message pertains to a scenario
}

export type MessageType =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'ping'
  | 'pong'
  // Scenario messages
  | 'scenario_created'
  | 'scenario_updated' // General update (e.g. state change)
  | 'scenario_deleted'
  | 'scenario_list' // For sending list of available scenarios
  // Timeline messages
  | 'timeline_event' // A new event occurred
  | 'timeline_branched'
  | 'timeline_state_update' // Update on current time, active branch etc.
  // Agent messages
  | 'agent_action_taken' // Specific agent action detail
  | 'agent_state_changed'
  // User commands
  | 'subscribe_scenario'
  | 'unsubscribe_scenario'
  | 'create_scenario_command'
  | 'start_scenario_command'
  | 'pause_scenario_command'
  | 'resume_scenario_command'
  | 'inject_context_command'
  | 'branch_timeline_command';


export interface ClientConnection {
  readonly id: UUID; // Unique ID for this connection
  readonly websocket: any; // Actual WebSocket instance (type depends on library)
  readonly connectedAt: Timestamp;
  lastActivity: Timestamp;
  subscribedScenarios: Set<UUID>; // Scenarios this client is listening to
  readonly userId?: UUID; // Authenticated user ID, if any
  isActive: boolean;
  readonly remoteAddress?: string;
}

// ============================================================================
// AI Integration Types
// ============================================================================

export interface AIModelConfig {
  readonly provider: 'openrouter' | 'claude' | 'local' | string; // Allow custom providers
  readonly model: string; // Specific model name, e.g., "claude-3-opus-20240229"
  readonly apiKey?: string; // Handled securely, not stored in DB directly
  readonly baseURL?: string;
  readonly maxTokens?: number;
  readonly temperature?: PersonalityScore;
  readonly topP?: PersonalityScore;
  readonly presencePenalty?: PersonalityScore;
  readonly frequencyPenalty?: PersonalityScore;
  readonly customParameters?: Record<string, any>; // For provider-specific options
}

export interface AIResponse {
  readonly content: string;
  readonly confidence?: PersonalityScore;
  readonly reasoning?: string; // Explanation of how the AI arrived at the content
  readonly tokenUsage?: {
    readonly prompt: number;
    readonly completion: number;
    readonly total: number;
  };
  readonly latency?: number; // Time taken for AI to respond, in ms
  readonly modelUsed: string; // Actual model that generated response (useful for fallbacks)
  readonly timestamp: Timestamp;
  readonly error?: string; // If there was an error during generation
}

export interface ContextInjection {
  readonly id: UUID;
  readonly targetAgent: UUID;
  readonly content: string;
  readonly type: 'information' | 'instruction' | 'constraint' | 'goal_update' | 'world_event';
  readonly priority?: 'low' | 'medium' | 'high' | 'urgent';
  readonly timestamp: Timestamp; // When the injection was made
  readonly injectedBy?: UUID; // User or system ID
  processed: boolean; // Has the agent acknowledged/processed this?
  impact?: PersonalityScore; // Assessed impact of this injection
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseConfig {
  readonly type: 'sqlite' | 'postgres' | 'mysql'; // Example, could be more
  readonly path?: string; // For SQLite
  readonly connectionString?: string; // For server-based DBs
  readonly maxConnections?: number;
  readonly busyTimeout?: number; // For SQLite
  readonly journalMode?: 'WAL' | 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'OFF'; // SQLite specific
  readonly synchronous?: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA'; // SQLite specific
}

export interface QueryResult<T = any> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly affectedRows?: number;
  readonly lastInsertRowid?: number | string; // Varies by DB
  readonly executionTime: number; // In ms
}

// ============================================================================
// Error and Performance Types
// ============================================================================

export interface AegntiXError extends Error {
  readonly component: string; // e.g., "ScenarioEngine", "AegntManager"
  readonly operation: string; // e.g., "createScenario", "getAegntAction"
  readonly context?: any; // Additional relevant data
  readonly timestamp: Timestamp;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly recoverable?: boolean; // Can the operation be retried?
  readonly errorCode?: string; // Internal error code
}

export interface PerformanceMetric {
  readonly operation: string;
  readonly component: string;
  readonly duration: number; // In ms
  readonly timestamp: Timestamp;
  readonly success: boolean;
  readonly metadata?: Record<string, any>; // e.g., agentId, scenarioId
}

export interface SystemHealth {
  readonly uptime: number; // seconds
  readonly memoryUsage: { rss: number, heapTotal: number, heapUsed: number, external: number, arrayBuffers: number }; // In bytes
  readonly cpuUsage: { user: number, system: number }; // From process.cpuUsage()
  readonly activeConnections: number;
  readonly activeScenarios: number;
  readonly totalAgents: number;
  readonly errorRate: PersonalityScore; // Errors per unit of time or operations
  readonly averageResponseTime: number; // ms, for key operations
  readonly lastHealthCheck: Timestamp;
  readonly dbStatus?: string; // "OK", "DEGRADED", "ERROR"
  readonly messageQueueSize?: number; // If using a message queue
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  readonly port: number;
  readonly host: string;
  readonly cors?: { // Optional CORS config
    readonly enabled: boolean;
    readonly origins: string[]; // Allowed origins
    readonly methods?: string[]; // Allowed methods
    readonly allowedHeaders?: string[];
  };
  readonly rateLimit?: { // Optional rate limiting
    readonly enabled: boolean;
    readonly maxRequests: number; // Per windowMs
    readonly windowMs: number; // In milliseconds
  };
  readonly websocket?: {
    readonly path?: string; // e.g., "/ws"
    readonly maxConnections?: number;
    readonly heartbeatInterval?: number; // ms
    readonly timeout?: number; // ms for idle connections
  };
  readonly staticFilesPath?: string; // Path to serve static files from
}

export interface AegntiXConfig {
  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly ai: AIModelConfig; // Default AI model config
  readonly logging: {
    readonly level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
    readonly maxLogs?: number; // Max log entries to keep in memory
    readonly logFilePath?: string; // Optional file logging
  };
  readonly performance?: {
    readonly metricsEnabled?: boolean;
    readonly healthCheckInterval?: number; // ms
    readonly maxTimelineEvents?: number; // Per scenario in memory
  };
  readonly featureFlags?: Record<string, boolean>;
}

// ============================================================================
// Utility Types & Functions
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
  // Basic check, can be more robust (e.g., reasonable range)
  return typeof value === 'number' && value > 0;
}

// Factory functions for branded types
export function createUUID(): UUID {
  return crypto.randomUUID() as UUID;
}

export function createTimestamp(): Timestamp {
  return Date.now() as Timestamp;
}

export function createPersonalityScore(value: number): PersonalityScore {
  if (value < 0 || value > 1) {
    // Consider throwing a specific AegntiXError
    throw new Error(`PersonalityScore must be between 0 and 1, got ${value}`);
  }
  return value as PersonalityScore;
}
