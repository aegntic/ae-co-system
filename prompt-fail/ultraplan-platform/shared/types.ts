// ULTRAPLAN Shared Types - Universal First Principles Project Resolution Framework

export interface ProjectAnalysis {
  id: string;
  url: string;
  platform: 'github' | 'gitlab' | 'bitbucket' | 'local';
  name: string;
  description: string;
  techStack: TechStack;
  problems: Problem[];
  dependencies: Dependency[];
  structure: ProjectStructure;
  metrics: ProjectMetrics;
  timestamp: Date;
}

export interface TechStack {
  languages: Language[];
  frameworks: Framework[];
  databases: string[];
  tools: Tool[];
  packageManagers: string[];
}

export interface Language {
  name: string;
  version?: string;
  percentage: number;
  files: number;
}

export interface Framework {
  name: string;
  version?: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'testing' | 'other';
}

export interface Tool {
  name: string;
  category: 'ci/cd' | 'testing' | 'linting' | 'bundler' | 'container' | 'other';
  configured: boolean;
}

export interface Problem {
  id: string;
  type: ProblemType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location?: string;
  suggestedFix?: string;
  estimatedEffort?: number; // hours
}

export enum ProblemType {
  MISSING_TESTS = 'missing_tests',
  NO_CI_CD = 'no_ci_cd',
  OUTDATED_DEPENDENCIES = 'outdated_dependencies',
  SECURITY_VULNERABILITIES = 'security_vulnerabilities',
  PERFORMANCE_ISSUES = 'performance_issues',
  ARCHITECTURE_PROBLEMS = 'architecture_problems',
  CODE_QUALITY = 'code_quality',
  DOCUMENTATION = 'documentation',
  CONFIGURATION = 'configuration',
  ACCESSIBILITY = 'accessibility'
}

export interface Dependency {
  from: string;
  to: string;
  type: 'import' | 'require' | 'extends' | 'implements' | 'uses';
  strength: 'strong' | 'weak';
}

export interface ProjectStructure {
  rootPath: string;
  directories: Directory[];
  entryPoints: string[];
  configFiles: ConfigFile[];
}

export interface Directory {
  path: string;
  purpose: string;
  fileCount: number;
  subdirectories: string[];
}

export interface ConfigFile {
  path: string;
  type: string;
  valid: boolean;
  issues?: string[];
}

export interface ProjectMetrics {
  totalFiles: number;
  totalLines: number;
  testCoverage?: number;
  technicalDebt?: number;
  complexity?: number;
  lastCommit?: Date;
  contributors?: number;
}

// UltraPlan Types
export interface UltraPlan {
  id: string;
  projectId: string;
  title: string;
  description: string;
  phases: Phase[];
  estimatedDuration: number; // hours
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  tags: string[];
  successCriteria: string[];
  createdAt: Date;
  updatedAt: Date;
  author: string;
  price?: number; // for marketplace plans
  rating?: number;
  downloads?: number;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  groups: TaskGroup[];
  order: number;
  estimatedDuration: number;
}

export interface TaskGroup {
  id: string;
  name: string;
  description: string;
  parallel: boolean;
  tasks: Task[];
  dependencies: string[]; // group IDs
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  targetFiles: string[];
  commands?: string[];
  expectedOutputs: ExpectedOutput[];
  validationSteps: ValidationStep[];
  estimatedDuration: number; // minutes
  dependencies: string[]; // task IDs
}

export enum TaskType {
  CREATE_FILE = 'create_file',
  MODIFY_FILE = 'modify_file',
  DELETE_FILE = 'delete_file',
  RUN_COMMAND = 'run_command',
  INSTALL_DEPENDENCY = 'install_dependency',
  CONFIGURE_TOOL = 'configure_tool',
  WRITE_TEST = 'write_test',
  REFACTOR_CODE = 'refactor_code',
  UPDATE_DOCUMENTATION = 'update_documentation'
}

export interface ExpectedOutput {
  type: 'file' | 'console' | 'test' | 'metric';
  path?: string;
  pattern?: string;
  description: string;
}

export interface ValidationStep {
  type: 'command' | 'file_exists' | 'file_contains' | 'test_passes' | 'metric_check';
  target: string;
  expected: string;
  description: string;
}

// Subscription & Revenue Types
export interface User {
  id: string;
  email: string;
  name: string;
  subscription: Subscription;
  projects: string[];
  purchasedPlans: string[];
  createdAt: Date;
  lastActive: Date;
}

export interface Subscription {
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: Date;
  projectsUsed: number;
  projectsLimit: number;
  features: Feature[];
}

export interface Feature {
  name: string;
  enabled: boolean;
  limit?: number;
  used?: number;
}

// API Communication Types
export interface AnalyzeProjectRequest {
  url: string;
  accessToken?: string;
  deepAnalysis?: boolean;
}

export interface GeneratePlanRequest {
  projectAnalysis: ProjectAnalysis;
  preferences?: PlanPreferences;
}

export interface PlanPreferences {
  focusAreas?: ProblemType[];
  maxDuration?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  includeTests?: boolean;
  includeDocs?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMetadata {
  requestId: string;
  duration: number;
  timestamp: Date;
}

// Extension <-> Webapp Communication
export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload: any;
  timestamp: Date;
}

export enum ExtensionMessageType {
  ANALYZE_PROJECT = 'analyze_project',
  ANALYSIS_COMPLETE = 'analysis_complete',
  GENERATE_PLAN = 'generate_plan',
  PLAN_GENERATED = 'plan_generated',
  OPEN_WEBAPP = 'open_webapp',
  AUTH_REQUEST = 'auth_request',
  AUTH_RESPONSE = 'auth_response',
  ERROR = 'error'
}