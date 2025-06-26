// Project Detection and Fingerprinting Types

export interface ProjectFingerprint {
  id: string;
  name: string;
  path: string;
  type: ProjectType;
  metadata: ProjectMetadata;
  confidence: number; // 0-1, target 99%+ accuracy
  lastUpdated: Date;
  gitInfo?: GitInfo;
}

export enum ProjectType {
  WEB_FRONTEND = 'web_frontend',
  WEB_BACKEND = 'web_backend',
  MOBILE_APP = 'mobile_app',
  DESKTOP_APP = 'desktop_app',
  LIBRARY = 'library',
  MICROSERVICE = 'microservice',
  MONOREPO = 'monorepo',
  DATA_SCIENCE = 'data_science',
  DEVOPS = 'devops',
  UNKNOWN = 'unknown'
}

export interface ProjectMetadata {
  framework?: string;
  language: string[];
  packageManagers: string[];
  buildTools: string[];
  testFrameworks: string[];
  cicdTools: string[];
  dockerized: boolean;
  hasTests: boolean;
  hasDocumentation: boolean;
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
}

export interface GitInfo {
  remoteUrl?: string;
  branch: string;
  lastCommit: string;
  commitFrequency: 'low' | 'moderate' | 'high';
  contributors: number;
  hasRemote: boolean;
}

export interface ProjectContext {
  currentFile?: string;
  activeApplication: string;
  activeWindow: string;
  currentDirectory: string;
  recentActivity: ActivityEvent[];
  environmentVariables: Record<string, string>;
}

export interface ActivityEvent {
  type: ActivityType;
  timestamp: Date;
  source: string;
  metadata: Record<string, any>;
  importance: number; // 0-1 ML-generated importance score
}

export enum ActivityType {
  FILE_SAVE = 'file_save',
  FILE_OPEN = 'file_open',
  GIT_COMMIT = 'git_commit',
  GIT_PUSH = 'git_push',
  GIT_PULL = 'git_pull',
  TEST_RUN = 'test_run',
  TEST_PASS = 'test_pass',
  TEST_FAIL = 'test_fail',
  BUILD_START = 'build_start',
  BUILD_SUCCESS = 'build_success',
  BUILD_FAIL = 'build_fail',
  DEBUG_START = 'debug_start',
  DEBUG_STOP = 'debug_stop',
  ERROR_OCCURRED = 'error_occurred',
  ERROR_RESOLVED = 'error_resolved',
  DEPLOYMENT = 'deployment',
  CODE_REVIEW = 'code_review',
  TYPING = 'typing',
  SCROLLING = 'scrolling',
  TAB_SWITCH = 'tab_switch',
  WINDOW_SWITCH = 'window_switch'
}