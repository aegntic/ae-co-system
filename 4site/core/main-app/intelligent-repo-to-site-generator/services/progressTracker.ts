import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface AnalysisProgress {
  jobId: string;
  stage: AnalysisStage;
  substage?: string;
  progress: number; // 0-100
  message: string;
  startTime: number;
  currentTime: number;
  estimatedCompletion?: number;
  details?: ProgressDetails;
}

export interface ProgressDetails {
  filesScanned?: number;
  totalFiles?: number;
  currentFile?: string;
  analysisDepth?: number;
  errorCount?: number;
  warnings?: string[];
  metrics?: StageMetrics;
}

export interface StageMetrics {
  processingRate?: number; // files per second
  averageFileSize?: number;
  memoryUsage?: number;
  apiCallsUsed?: number;
  estimatedCost?: number;
}

export enum AnalysisStage {
  INITIALIZING = 'initializing',
  REPOSITORY_SCAN = 'repository_scan',
  FILE_ANALYSIS = 'file_analysis',
  AI_PROCESSING = 'ai_processing',
  CONTENT_GENERATION = 'content_generation',
  VISUAL_GENERATION = 'visual_generation',
  SITE_ASSEMBLY = 'site_assembly',
  OPTIMIZATION = 'optimization',
  FINALIZATION = 'finalization',
  COMPLETE = 'complete',
  ERROR = 'error'
}

interface AnalysisJob {
  id: string;
  repoUrl: string;
  startTime: number;
  currentStage: AnalysisStage;
  progress: number;
  estimatedDuration: number;
  subscribers: Set<WebSocket>;
  stageHistory: StageHistory[];
  config: JobConfig;
}

interface StageHistory {
  stage: AnalysisStage;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  details?: any;
}

interface JobConfig {
  maxFiles: number;
  analysisDepth: 'shallow' | 'medium' | 'deep';
  enableVisuals: boolean;
  enableAI: boolean;
  timeoutMs: number;
}

export class ProgressTracker extends EventEmitter {
  private jobs: Map<string, AnalysisJob> = new Map();
  private wsServer: WebSocket.Server | null = null;
  private readonly progressThrottleMs = 500; // Throttle progress updates
  private progressUpdateTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(wsPort?: number) {
    super();
    if (wsPort && typeof window === 'undefined') {
      this.initializeWebSocketServer(wsPort);
    }
  }

  // Job Management
  createJob(
    jobId: string, 
    repoUrl: string, 
    config: Partial<JobConfig> = {}
  ): void {
    const defaultConfig: JobConfig = {
      maxFiles: 100,
      analysisDepth: 'medium',
      enableVisuals: true,
      enableAI: true,
      timeoutMs: 600000, // 10 minutes
    };

    const job: AnalysisJob = {
      id: jobId,
      repoUrl,
      startTime: Date.now(),
      currentStage: AnalysisStage.INITIALIZING,
      progress: 0,
      estimatedDuration: this.estimateJobDuration(config.analysisDepth || 'medium'),
      subscribers: new Set(),
      stageHistory: [],
      config: { ...defaultConfig, ...config },
    };

    this.jobs.set(jobId, job);
    this.updateProgress(jobId, {
      stage: AnalysisStage.INITIALIZING,
      progress: 0,
      message: 'Analysis job created and queued...',
    });
  }

  updateProgress(
    jobId: string, 
    update: Partial<AnalysisProgress>
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.warn(`Job ${jobId} not found for progress update`);
      return;
    }

    // Update job state
    if (update.stage && update.stage !== job.currentStage) {
      this.recordStageTransition(job, update.stage);
    }

    if (update.progress !== undefined) {
      job.progress = Math.min(100, Math.max(0, update.progress));
    }

    // Throttle progress updates to avoid overwhelming clients
    if (this.progressUpdateTimers.has(jobId)) {
      clearTimeout(this.progressUpdateTimers.get(jobId)!);
    }

    const timer = setTimeout(() => {
      this.broadcastProgress(job, update);
      this.progressUpdateTimers.delete(jobId);
    }, this.progressThrottleMs);

    this.progressUpdateTimers.set(jobId, timer);

    // Emit progress event for local listeners
    this.emit('progress', {
      jobId,
      stage: job.currentStage,
      progress: job.progress,
      message: update.message || '',
      startTime: job.startTime,
      currentTime: Date.now(),
      estimatedCompletion: this.calculateETA(job),
      details: update.details,
    });
  }

  completeJob(jobId: string, success: boolean = true): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const finalStage = success ? AnalysisStage.COMPLETE : AnalysisStage.ERROR;
    this.recordStageTransition(job, finalStage);

    this.updateProgress(jobId, {
      stage: finalStage,
      progress: 100,
      message: success ? 'Analysis completed successfully!' : 'Analysis failed.',
    });

    // Clean up after delay
    setTimeout(() => {
      this.jobs.delete(jobId);
    }, 30000); // Keep job data for 30 seconds after completion
  }

  subscribeToJob(jobId: string, ws: WebSocket): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.subscribers.add(ws);

    // Send current progress immediately
    this.sendProgressToClient(ws, {
      jobId,
      stage: job.currentStage,
      progress: job.progress,
      message: `Connected to analysis job ${jobId}`,
      startTime: job.startTime,
      currentTime: Date.now(),
      estimatedCompletion: this.calculateETA(job),
    });

    // Handle WebSocket disconnection
    ws.on('close', () => {
      job.subscribers.delete(ws);
    });

    return true;
  }

  getJobStatus(jobId: string): AnalysisProgress | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      jobId,
      stage: job.currentStage,
      progress: job.progress,
      message: `Current stage: ${job.currentStage}`,
      startTime: job.startTime,
      currentTime: Date.now(),
      estimatedCompletion: this.calculateETA(job),
    };
  }

  getJobHistory(jobId: string): StageHistory[] {
    const job = this.jobs.get(jobId);
    return job?.stageHistory || [];
  }

  // Advanced Progress Analytics
  getJobMetrics(jobId: string): JobMetrics | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const currentTime = Date.now();
    const elapsed = currentTime - job.startTime;
    const estimatedTotal = job.estimatedDuration;
    const completionRate = elapsed > 0 ? job.progress / elapsed : 0;

    return {
      jobId,
      elapsedTime: elapsed,
      estimatedTotal,
      progressRate: completionRate,
      stagesCompleted: job.stageHistory.filter(s => s.success).length,
      averageStageTime: this.calculateAverageStageTime(job),
      memoryUsage: process.memoryUsage(),
      isOnSchedule: elapsed <= (estimatedTotal * (job.progress / 100)) * 1.2,
    };
  }

  // WebSocket Server Management
  private initializeWebSocketServer(port: number): void {
    try {
      this.wsServer = new WebSocket.Server({ port });
      
      this.wsServer.on('connection', (ws: WebSocket, request) => {
        console.log('WebSocket client connected');

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message);
            this.handleWebSocketMessage(ws, data);
          } catch (error) {
            console.error('Invalid WebSocket message:', error);
          }
        });

        ws.on('close', () => {
          console.log('WebSocket client disconnected');
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });

      console.log(`Progress tracking WebSocket server running on port ${port}`);
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
    }
  }

  private handleWebSocketMessage(ws: WebSocket, data: any): void {
    switch (data.type) {
      case 'subscribe':
        if (data.jobId) {
          const success = this.subscribeToJob(data.jobId, ws);
          ws.send(JSON.stringify({
            type: 'subscription',
            success,
            jobId: data.jobId,
          }));
        }
        break;

      case 'getStatus':
        if (data.jobId) {
          const status = this.getJobStatus(data.jobId);
          ws.send(JSON.stringify({
            type: 'status',
            data: status,
          }));
        }
        break;

      case 'getMetrics':
        if (data.jobId) {
          const metrics = this.getJobMetrics(data.jobId);
          ws.send(JSON.stringify({
            type: 'metrics',
            data: metrics,
          }));
        }
        break;

      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  private broadcastProgress(job: AnalysisJob, update: Partial<AnalysisProgress>): void {
    const progress: AnalysisProgress = {
      jobId: job.id,
      stage: job.currentStage,
      progress: job.progress,
      message: update.message || '',
      startTime: job.startTime,
      currentTime: Date.now(),
      estimatedCompletion: this.calculateETA(job),
      details: update.details,
    };

    // Broadcast to WebSocket subscribers
    job.subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendProgressToClient(ws, progress);
      } else {
        job.subscribers.delete(ws);
      }
    });
  }

  private sendProgressToClient(ws: WebSocket, progress: AnalysisProgress): void {
    try {
      ws.send(JSON.stringify({
        type: 'progress',
        data: progress,
      }));
    } catch (error) {
      console.error('Failed to send progress to client:', error);
    }
  }

  private recordStageTransition(job: AnalysisJob, newStage: AnalysisStage): void {
    // Complete previous stage
    if (job.stageHistory.length > 0) {
      const lastStage = job.stageHistory[job.stageHistory.length - 1];
      if (!lastStage.endTime) {
        lastStage.endTime = Date.now();
        lastStage.duration = lastStage.endTime - lastStage.startTime;
        lastStage.success = newStage !== AnalysisStage.ERROR;
      }
    }

    // Start new stage
    job.currentStage = newStage;
    job.stageHistory.push({
      stage: newStage,
      startTime: Date.now(),
      success: false, // Will be updated when stage completes
    });
  }

  private calculateETA(job: AnalysisJob): number {
    if (job.progress === 0) return job.startTime + job.estimatedDuration;

    const elapsed = Date.now() - job.startTime;
    const rate = job.progress / elapsed;
    const remaining = (100 - job.progress) / rate;
    
    return Date.now() + remaining;
  }

  private calculateAverageStageTime(job: AnalysisJob): number {
    const completedStages = job.stageHistory.filter(s => s.duration);
    if (completedStages.length === 0) return 0;

    const totalTime = completedStages.reduce((sum, stage) => sum + (stage.duration || 0), 0);
    return totalTime / completedStages.length;
  }

  private estimateJobDuration(depth: string): number {
    const baseTimes = {
      shallow: 60000,  // 1 minute
      medium: 180000,  // 3 minutes
      deep: 600000,    // 10 minutes
    };
    return baseTimes[depth as keyof typeof baseTimes] || baseTimes.medium;
  }

  // Cleanup
  destroy(): void {
    this.progressUpdateTimers.forEach(timer => clearTimeout(timer));
    this.progressUpdateTimers.clear();
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    this.jobs.clear();
    this.removeAllListeners();
  }
}

export interface JobMetrics {
  jobId: string;
  elapsedTime: number;
  estimatedTotal: number;
  progressRate: number;
  stagesCompleted: number;
  averageStageTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  isOnSchedule: boolean;
}

// React hook for client-side progress tracking
export function useProgressTracking(jobId: string | null, wsUrl?: string) {
  const [progress, setProgress] = React.useState<AnalysisProgress | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!jobId || !wsUrl) return;

    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      ws.send(JSON.stringify({ type: 'subscribe', jobId }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'progress') {
          setProgress(message.data);
        }
      } catch (err) {
        console.error('Failed to parse progress message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (err) => {
      setError('WebSocket connection failed');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [jobId, wsUrl]);

  return { progress, isConnected, error };
}

// Type imports for React hook
declare const React: any;