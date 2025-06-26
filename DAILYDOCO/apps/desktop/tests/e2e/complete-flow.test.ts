import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { WebSocket } from 'ws';
import axios from 'axios';

// Test utilities
import { 
  waitForCondition, 
  createTestProject, 
  cleanupTestData,
  mockVideoCapture 
} from '../utils/test-helpers';

// DailyDoco modules
import { DailyDocoCore } from '../../src/core';
import { CaptureEngine } from '../../src/capture';
import { VideoCompiler } from '../../src/video-compiler';
import { AITestAudience } from '../../src/ai-test-audience';
import { Aegnt27Engine } from '../../src/aegnt27';
import { PerformanceMonitor } from '../../src/performance-monitor';

describe('Complete Video Generation Flow - End to End', () => {
  let dailydoco: DailyDocoCore;
  let performanceMonitor: PerformanceMonitor;
  let testProjectPath: string;
  let wsClient: WebSocket;

  beforeAll(async () => {
    // Initialize DailyDoco system
    dailydoco = new DailyDocoCore({
      captureQuality: 'high',
      enableGPU: true,
      aiModels: {
        primary: 'deepseek-r1',
        fallback: 'gemma-3'
      }
    });

    performanceMonitor = new PerformanceMonitor();
    
    // Create test project directory
    testProjectPath = await createTestProject({
      name: 'e2e-test-project',
      type: 'react-typescript',
      includeGitRepo: true
    });

    // Connect to WebSocket for real-time updates
    wsClient = new WebSocket('ws://localhost:8080/ws');
    await new Promise((resolve) => {
      wsClient.on('open', resolve);
    });

    // Start all services
    await dailydoco.initialize();
  }, 30000); // 30 second timeout for initialization

  afterAll(async () => {
    // Cleanup
    wsClient.close();
    await dailydoco.shutdown();
    await cleanupTestData(testProjectPath);
  });

  describe('Core Capture and Processing', () => {
    it('should detect project and start capture automatically', async () => {
      // Start monitoring the test project
      const projectInfo = await dailydoco.detectProject(testProjectPath);
      
      expect(projectInfo).toMatchObject({
        name: 'e2e-test-project',
        type: 'react-typescript',
        gitRepo: true,
        packageManager: 'npm',
        framework: 'react',
        language: 'typescript'
      });

      // Start capture
      const captureSession = await dailydoco.startCapture({
        projectPath: testProjectPath,
        captureMode: 'intelligent',
        quality: 'high'
      });

      expect(captureSession.id).toBeDefined();
      expect(captureSession.status).toBe('recording');
      expect(captureSession.fps).toBeGreaterThanOrEqual(30);
    });

    it('should capture development activity with < 5% CPU usage', async () => {
      // Start performance monitoring
      performanceMonitor.startMonitoring();

      // Simulate development activity
      const activities = [
        mockVideoCapture.codeWriting({ duration: 30, language: 'typescript' }),
        mockVideoCapture.debugging({ duration: 20, errorType: 'TypeError' }),
        mockVideoCapture.testing({ duration: 15, testsRun: 10, testsPassed: 8 }),
        mockVideoCapture.terminalCommand({ duration: 10, command: 'npm test' })
      ];

      // Execute activities while capturing
      for (const activity of activities) {
        await activity.execute();
        
        // Check CPU usage during activity
        const metrics = performanceMonitor.getCurrentMetrics();
        expect(metrics.cpuUsage).toBeLessThan(5); // < 5% CPU
        expect(metrics.memoryUsage).toBeLessThan(200 * 1024 * 1024); // < 200MB
      }

      // Stop capture
      const captureData = await dailydoco.stopCapture();
      
      expect(captureData.duration).toBeGreaterThan(60); // At least 60 seconds
      expect(captureData.framesCaptured).toBeGreaterThan(1800); // 30fps * 60s
      expect(captureData.droppedFrames).toBeLessThan(10); // < 10 dropped frames
    });

    it('should apply intelligent clip selection with ML scoring', async () => {
      const captureData = await dailydoco.getLastCapture();
      
      // Apply intelligent clip selection
      const clipSelector = dailydoco.getClipSelector();
      const selectedClips = await clipSelector.selectClips(captureData, {
        targetDuration: 300, // 5 minutes
        minimumImportance: 0.6,
        includeBreakthroughs: true,
        optimizeForEngagement: true
      });

      expect(selectedClips.length).toBeGreaterThan(0);
      expect(selectedClips.length).toBeLessThan(20); // Reasonable number of clips
      
      // Verify clip quality
      for (const clip of selectedClips) {
        expect(clip.importanceScore).toBeGreaterThan(0.6);
        expect(clip.duration).toBeGreaterThan(10); // At least 10 seconds
        expect(clip.duration).toBeLessThan(60); // No more than 60 seconds
        expect(clip.activityType).toBeDefined();
      }

      // Check total duration is close to target
      const totalDuration = selectedClips.reduce((sum, clip) => sum + clip.duration, 0);
      expect(Math.abs(totalDuration - 300)).toBeLessThan(30); // Within 30 seconds of target
    });
  });

  describe('AI Enhancement and Test Audience', () => {
    it('should analyze video with AI test audience and get > 85% engagement prediction', async () => {
      const compiledVideo = await dailydoco.getCompiledVideo();
      const testAudience = new AITestAudience({
        audienceSize: 50,
        diversityLevel: 'high'
      });

      // Run AI test audience evaluation
      const testResults = await testAudience.evaluate(compiledVideo, {
        platforms: ['youtube', 'linkedin'],
        targetAudience: 'developers',
        contentType: 'tutorial'
      });

      expect(testResults.overallEngagement).toBeGreaterThan(0.85);
      expect(testResults.predictedRetention).toBeGreaterThan(0.7);
      expect(testResults.predictedCTR).toBeGreaterThan(0.1);
      
      // Check individual persona feedback
      expect(testResults.personas.length).toBe(50);
      const engagedPersonas = testResults.personas.filter(p => p.engagement > 0.8);
      expect(engagedPersonas.length).toBeGreaterThan(40); // 80% highly engaged
      
      // Verify feedback quality
      expect(testResults.insights).toContain(expect.objectContaining({
        type: expect.stringMatching(/improvement|strength/),
        confidence: expect.any(Number),
        suggestion: expect.any(String)
      }));
    });

    it('should apply aegnt-27 humanization and maintain 95%+ authenticity', async () => {
      const video = await dailydoco.getCompiledVideo();
      const aegnt27 = new Aegnt27Engine({
        mode: 'ultra',
        targetAuthenticity: 0.95
      });

      // Apply humanization
      const humanizedVideo = await aegnt27.humanize(video, {
        enhanceNarration: true,
        naturalizeMouseMovement: true,
        varyTypingPatterns: true,
        injectMicroPauses: true
      });

      // Test against AI detectors
      const detectionResults = await aegnt27.testAgainstDetectors(humanizedVideo, {
        detectors: ['gptzero', 'originality', 'youtube', 'internal'],
        thoroughness: 'comprehensive'
      });

      expect(detectionResults.overallAuthenticity).toBeGreaterThan(0.95);
      expect(detectionResults.detectorScores.gptzero).toBeGreaterThan(0.9);
      expect(detectionResults.detectorScores.youtube).toBeGreaterThan(0.95);
      
      // Verify humanization didn't degrade content quality
      expect(humanizedVideo.duration).toBeCloseTo(video.duration, 5); // Within 5 seconds
      expect(humanizedVideo.quality).toBeGreaterThanOrEqual(video.quality * 0.95);
    });
  });

  describe('Performance and Real-time Processing', () => {
    it('should compile video in < 2x realtime with GPU acceleration', async () => {
      const captureData = await dailydoco.getLastCapture();
      const startTime = Date.now();

      // Compile video with GPU acceleration
      const compiler = new VideoCompiler({
        enableGPU: true,
        quality: 'high',
        codec: 'h264',
        preset: 'fast'
      });

      const compiledVideo = await compiler.compile(captureData, {
        resolution: '1920x1080',
        framerate: 30,
        bitrate: 8000
      });

      const processingTime = (Date.now() - startTime) / 1000; // seconds
      const videoLength = compiledVideo.duration;
      const processingRatio = processingTime / videoLength;

      expect(processingRatio).toBeLessThan(2); // < 2x realtime
      expect(compiledVideo.fileSize).toBeLessThan(500 * 1024 * 1024); // < 500MB for reasonable length
      expect(compiledVideo.quality.bitrate).toBeCloseTo(8000, 500); // Within 500kbps of target
    });

    it('should handle 4K content with acceptable performance', async () => {
      // Switch to 4K capture
      await dailydoco.updateSettings({
        captureResolution: '3840x2160',
        captureQuality: 'ultra'
      });

      // Capture 30 seconds of 4K content
      const capture4K = await dailydoco.captureSegment({
        duration: 30,
        resolution: '4K'
      });

      performanceMonitor.startMonitoring();
      
      // Process 4K content
      const processed4K = await dailydoco.processCapture(capture4K);
      
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics.peakCPU).toBeLessThan(80); // Peak CPU < 80%
      expect(metrics.averageFPS).toBeGreaterThan(25); // Maintain > 25 FPS
      expect(metrics.processingTime).toBeLessThan(60); // < 60 seconds for 30 second video
      expect(processed4K.quality).toBe('ultra');
    });
  });

  describe('Export and Platform Optimization', () => {
    it('should export optimized videos for multiple platforms', async () => {
      const video = await dailydoco.getFinalVideo();
      const exportManager = dailydoco.getExportManager();

      // Export for different platforms
      const platforms = ['youtube', 'linkedin', 'internal'];
      const exportJobs = await Promise.all(
        platforms.map(platform => 
          exportManager.export(video, {
            platform,
            autoOptimize: true,
            includeAegnt27: true,
            generateThumbnail: true
          })
        )
      );

      // Verify each export
      for (const job of exportJobs) {
        expect(job.status).toBe('completed');
        expect(job.outputFile).toBeDefined();
        
        const exportedVideo = await fs.readFile(job.outputFile);
        const stats = await fs.stat(job.outputFile);
        
        // Platform-specific checks
        switch (job.platform) {
          case 'youtube':
            expect(job.optimization.resolution).toBe('1920x1080');
            expect(job.optimization.codec).toBe('h264');
            expect(stats.size).toBeLessThan(1024 * 1024 * 1024); // < 1GB
            break;
          case 'linkedin':
            expect(job.optimization.maxDuration).toBe(600); // 10 minutes max
            expect(stats.size).toBeLessThan(5 * 1024 * 1024 * 1024); // < 5GB
            break;
          case 'internal':
            expect(job.optimization.quality).toBe('maximum');
            break;
        }
        
        // Verify thumbnail generation
        expect(job.thumbnail).toBeDefined();
        expect(job.thumbnail.dimensions).toMatch(/\d+x\d+/);
      }
    });

    it('should generate SEO-optimized metadata for each platform', async () => {
      const video = await dailydoco.getFinalVideo();
      const metadataGenerator = dailydoco.getMetadataGenerator();

      const metadata = await metadataGenerator.generate(video, {
        platforms: ['youtube', 'linkedin'],
        includeAIOptimization: true
      });

      // YouTube metadata
      expect(metadata.youtube.title.length).toBeLessThanOrEqual(100);
      expect(metadata.youtube.description.length).toBeLessThanOrEqual(5000);
      expect(metadata.youtube.tags.length).toBeGreaterThan(5);
      expect(metadata.youtube.tags.length).toBeLessThanOrEqual(500); // Character limit
      expect(metadata.youtube.thumbnail).toBeDefined();

      // LinkedIn metadata  
      expect(metadata.linkedin.title.length).toBeLessThanOrEqual(70);
      expect(metadata.linkedin.description.length).toBeLessThanOrEqual(1300);
      expect(metadata.linkedin.hashtags.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Real-time Monitoring and Feedback', () => {
    it('should provide real-time status updates via WebSocket', async () => {
      const statusUpdates: any[] = [];
      
      wsClient.on('message', (data) => {
        statusUpdates.push(JSON.parse(data.toString()));
      });

      // Start a new capture session
      await dailydoco.startCapture({ projectPath: testProjectPath });

      // Wait for status updates
      await waitForCondition(() => statusUpdates.length > 5, 10000);

      // Verify status update structure
      expect(statusUpdates).toContainEqual(
        expect.objectContaining({
          type: 'capture_started',
          data: expect.objectContaining({
            sessionId: expect.any(String),
            timestamp: expect.any(String)
          })
        })
      );

      expect(statusUpdates).toContainEqual(
        expect.objectContaining({
          type: 'metrics_update',
          data: expect.objectContaining({
            fps: expect.any(Number),
            cpuUsage: expect.any(Number),
            memoryUsage: expect.any(Number)
          })
        })
      );
    });

    it('should integrate with VS Code extension seamlessly', async () => {
      // Mock VS Code extension connection
      const vscodeClient = axios.create({
        baseURL: 'http://localhost:8081/vscode',
        timeout: 5000
      });

      // Register extension
      const registration = await vscodeClient.post('/register', {
        extensionId: 'dailydoco.vscode',
        version: '1.0.0'
      });

      expect(registration.data.token).toBeDefined();

      // Test extension commands
      const commands = await vscodeClient.get('/commands', {
        headers: { Authorization: `Bearer ${registration.data.token}` }
      });

      expect(commands.data).toContainEqual(
        expect.objectContaining({
          command: 'dailydoco.startCapture',
          title: 'Start DailyDoco Capture'
        })
      );

      // Trigger capture from VS Code
      const captureResponse = await vscodeClient.post('/execute', {
        command: 'dailydoco.startCapture',
        args: { workspace: testProjectPath }
      }, {
        headers: { Authorization: `Bearer ${registration.data.token}` }
      });

      expect(captureResponse.data.success).toBe(true);
      expect(captureResponse.data.sessionId).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle capture interruptions gracefully', async () => {
      // Start capture
      const session = await dailydoco.startCapture({ projectPath: testProjectPath });
      
      // Simulate interruption after 10 seconds
      setTimeout(() => {
        process.kill(process.pid, 'SIGINT');
      }, 10000);

      // Wait for graceful shutdown
      await waitForCondition(async () => {
        const status = await dailydoco.getSessionStatus(session.id);
        return status === 'interrupted' || status === 'saved';
      }, 15000);

      // Verify partial capture was saved
      const savedCapture = await dailydoco.getCapture(session.id);
      expect(savedCapture).toBeDefined();
      expect(savedCapture.status).toBe('partial');
      expect(savedCapture.duration).toBeGreaterThan(9); // At least 9 seconds captured
      
      // Verify recovery is possible
      const recovered = await dailydoco.recoverCapture(session.id);
      expect(recovered.success).toBe(true);
      expect(recovered.recoveredFrames).toBeGreaterThan(0);
    });

    it('should fallback gracefully when AI models are unavailable', async () => {
      // Disable primary AI model
      await dailydoco.updateSettings({
        aiModels: {
          primary: 'unavailable-model',
          fallback: 'gemma-3'
        }
      });

      // Attempt AI-powered operation
      const testAudience = new AITestAudience();
      const results = await testAudience.evaluate(
        await dailydoco.getCompiledVideo()
      );

      // Should still work with fallback
      expect(results).toBeDefined();
      expect(results.modelUsed).toBe('gemma-3');
      expect(results.overallEngagement).toBeGreaterThan(0.7); // May be slightly lower
      
      // Check warning was logged
      const logs = await dailydoco.getLogs({ level: 'warn' });
      expect(logs).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('Primary AI model unavailable')
        })
      );
    });
  });

  describe('Memory and Resource Management', () => {
    it('should maintain stable memory usage during long captures', async () => {
      const memoryReadings: number[] = [];
      
      // Monitor memory during 5-minute capture
      const memoryMonitor = setInterval(() => {
        const usage = process.memoryUsage();
        memoryReadings.push(usage.heapUsed);
      }, 5000); // Every 5 seconds

      // Start long capture
      await dailydoco.startCapture({
        projectPath: testProjectPath,
        maxDuration: 300 // 5 minutes
      });

      // Simulate continuous activity
      const activitySimulator = setInterval(async () => {
        await mockVideoCapture.randomActivity().execute();
      }, 2000);

      // Wait for capture to complete
      await waitForCondition(async () => {
        const status = await dailydoco.getCaptureStatus();
        return status === 'completed' || status === 'stopped';
      }, 310000); // 5 minutes + buffer

      clearInterval(memoryMonitor);
      clearInterval(activitySimulator);

      // Analyze memory usage
      const avgMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;
      const maxMemory = Math.max(...memoryReadings);
      const memoryGrowth = memoryReadings[memoryReadings.length - 1] - memoryReadings[0];

      expect(avgMemory).toBeLessThan(200 * 1024 * 1024); // Avg < 200MB
      expect(maxMemory).toBeLessThan(300 * 1024 * 1024); // Peak < 300MB
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Growth < 50MB
    });

    it('should clean up temporary files automatically', async () => {
      const tempDir = await dailydoco.getTempDirectory();
      const filesBefore = await fs.readdir(tempDir);

      // Perform capture and processing
      await dailydoco.captureAndProcess({
        duration: 60,
        autoCleanup: true
      });

      // Check temp files after processing
      const filesAfter = await fs.readdir(tempDir);
      
      // Should have cleaned up most temporary files
      expect(filesAfter.length).toBeLessThanOrEqual(filesBefore.length + 5);
      
      // Verify no large files left behind
      for (const file of filesAfter) {
        const stats = await fs.stat(path.join(tempDir, file));
        expect(stats.size).toBeLessThan(10 * 1024 * 1024); // No files > 10MB
      }
    });
  });
});

// Performance benchmark tests
describe('Performance Benchmarks', () => {
  it('should meet all performance targets', async () => {
    const benchmarkResults = await performanceMonitor.runBenchmarks({
      duration: 120, // 2 minute benchmark
      scenarios: ['capture', 'process', 'export']
    });

    // Core performance targets
    expect(benchmarkResults.capture.avgFPS).toBeGreaterThan(30);
    expect(benchmarkResults.capture.cpuUsage).toBeLessThan(5);
    expect(benchmarkResults.capture.droppedFrames).toBeLessThan(0.1); // < 0.1%

    // Processing performance
    expect(benchmarkResults.process.realtimeRatio).toBeLessThan(2); // < 2x realtime
    expect(benchmarkResults.process.gpuUtilization).toBeGreaterThan(70); // Good GPU usage

    // Export performance
    expect(benchmarkResults.export.avgSpeed).toBeGreaterThan(100); // > 100 FPS encoding
    expect(benchmarkResults.export.compressionRatio).toBeGreaterThan(0.7); // 70% size reduction

    // Overall system health
    expect(benchmarkResults.overall.stabilityScore).toBeGreaterThan(0.95); // 95% stable
  });
});