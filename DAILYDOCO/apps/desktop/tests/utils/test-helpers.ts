import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wait for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a test project with specified configuration
 */
export async function createTestProject(options: {
  name: string;
  type: string;
  includeGitRepo?: boolean;
  files?: { path: string; content: string }[];
}): Promise<string> {
  const projectDir = path.join(__dirname, '../../temp', `test-${options.name}-${uuidv4()}`);
  
  // Create project directory
  await fs.mkdir(projectDir, { recursive: true });
  
  // Create package.json for JavaScript/TypeScript projects
  if (options.type.includes('script')) {
    const packageJson = {
      name: options.name,
      version: '1.0.0',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        test: 'jest',
        build: 'tsc'
      },
      dependencies: {},
      devDependencies: {
        '@types/node': '^18.0.0',
        'typescript': '^5.0.0',
        'jest': '^29.0.0'
      }
    };
    
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }
  
  // Create TypeScript config if needed
  if (options.type.includes('typescript')) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      }
    };
    
    await fs.writeFile(
      path.join(projectDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    // Create src directory
    await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
  }
  
  // Initialize git repository if requested
  if (options.includeGitRepo) {
    execSync('git init', { cwd: projectDir });
    await fs.writeFile(
      path.join(projectDir, '.gitignore'),
      'node_modules/\ndist/\n.env\n*.log'
    );
  }
  
  // Create any additional files
  if (options.files) {
    for (const file of options.files) {
      const filePath = path.join(projectDir, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content);
    }
  }
  
  // Create a sample source file
  const sampleCode = options.type === 'react-typescript' ? `
import React from 'react';

interface AppProps {
  title: string;
}

const App: React.FC<AppProps> = ({ title }) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>Test application for DailyDoco</p>
    </div>
  );
};

export default App;
` : `
function main() {
  console.log('Test project for DailyDoco');
}

main();
`;
  
  const srcDir = options.type.includes('typescript') ? 'src' : '';
  await fs.writeFile(
    path.join(projectDir, srcDir, options.type.includes('react') ? 'App.tsx' : 'index.js'),
    sampleCode
  );
  
  return projectDir;
}

/**
 * Clean up test data and temporary files
 */
export async function cleanupTestData(projectPath: string): Promise<void> {
  try {
    await fs.rm(projectPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to cleanup test data at ${projectPath}:`, error);
  }
}

/**
 * Mock video capture activities
 */
export const mockVideoCapture = {
  codeWriting: (options: { duration: number; language: string }) => ({
    execute: async () => {
      // Simulate code writing activity
      const startTime = Date.now();
      const codeSnippets = [
        'const result = await processData(input);',
        'function handleError(error: Error) {',
        '  console.error("Processing failed:", error);',
        '  return { success: false, error: error.message };',
        '}',
        '',
        'export class DataProcessor {',
        '  private cache = new Map<string, any>();',
        '  async process(data: any): Promise<ProcessedData> {',
        '    // Implementation here',
        '  }',
        '}'
      ];
      
      // Simulate typing with delays
      for (const snippet of codeSnippets) {
        await new Promise(resolve => 
          setTimeout(resolve, (options.duration * 1000) / codeSnippets.length)
        );
      }
      
      return {
        type: 'code_writing',
        language: options.language,
        duration: (Date.now() - startTime) / 1000,
        linesWritten: codeSnippets.length
      };
    }
  }),
  
  debugging: (options: { duration: number; errorType: string }) => ({
    execute: async () => {
      const startTime = Date.now();
      
      // Simulate debugging steps
      const steps = [
        'Setting breakpoint at line 42',
        'Inspecting variable values',
        'Stepping through execution',
        'Found issue: ' + options.errorType,
        'Applying fix',
        'Testing fix',
        'Verification complete'
      ];
      
      for (const step of steps) {
        await new Promise(resolve => 
          setTimeout(resolve, (options.duration * 1000) / steps.length)
        );
      }
      
      return {
        type: 'debugging',
        errorType: options.errorType,
        duration: (Date.now() - startTime) / 1000,
        resolved: true
      };
    }
  }),
  
  testing: (options: { duration: number; testsRun: number; testsPassed: number }) => ({
    execute: async () => {
      const startTime = Date.now();
      
      // Simulate test execution
      for (let i = 0; i < options.testsRun; i++) {
        await new Promise(resolve => 
          setTimeout(resolve, (options.duration * 1000) / options.testsRun)
        );
      }
      
      return {
        type: 'testing',
        duration: (Date.now() - startTime) / 1000,
        testsRun: options.testsRun,
        testsPassed: options.testsPassed,
        testsFailed: options.testsRun - options.testsPassed,
        coverage: (options.testsPassed / options.testsRun) * 100
      };
    }
  }),
  
  terminalCommand: (options: { duration: number; command: string }) => ({
    execute: async () => {
      const startTime = Date.now();
      
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, options.duration * 1000));
      
      return {
        type: 'terminal_command',
        command: options.command,
        duration: (Date.now() - startTime) / 1000,
        output: `Executed: ${options.command}\nSuccess`,
        exitCode: 0
      };
    }
  }),
  
  randomActivity: () => {
    const activities = [
      mockVideoCapture.codeWriting({ duration: 20, language: 'typescript' }),
      mockVideoCapture.debugging({ duration: 15, errorType: 'ReferenceError' }),
      mockVideoCapture.testing({ duration: 10, testsRun: 5, testsPassed: 4 }),
      mockVideoCapture.terminalCommand({ duration: 5, command: 'npm run build' })
    ];
    
    return activities[Math.floor(Math.random() * activities.length)];
  }
};

/**
 * Create mock WebSocket server for testing
 */
export function createMockWebSocketServer(port: number = 8080): {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  broadcast: (data: any) => void;
  getConnections: () => number;
} {
  const WebSocket = require('ws');
  let wss: any;
  
  return {
    start: async () => {
      wss = new WebSocket.Server({ port });
      console.log(`Mock WebSocket server started on port ${port}`);
    },
    
    stop: async () => {
      if (wss) {
        wss.close();
        await new Promise(resolve => wss.on('close', resolve));
      }
    },
    
    broadcast: (data: any) => {
      if (wss) {
        wss.clients.forEach((client: any) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    },
    
    getConnections: () => {
      return wss ? wss.clients.size : 0;
    }
  };
}

/**
 * Generate test video file
 */
export async function generateTestVideo(options: {
  duration: number;
  resolution: string;
  fps: number;
  outputPath: string;
}): Promise<void> {
  // Use FFmpeg to generate a test video
  const command = `ffmpeg -f lavfi -i testsrc=duration=${options.duration}:size=${options.resolution}:rate=${options.fps} -c:v libx264 -preset fast -y "${options.outputPath}"`;
  
  execSync(command, { stdio: 'ignore' });
}

/**
 * Performance measurement utilities
 */
export class PerformanceTracker {
  private measurements: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();
  
  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }
  
  end(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      throw new Error(`No start time found for measurement: ${name}`);
    }
    
    const duration = performance.now() - startTime;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);
    
    this.startTimes.delete(name);
    return duration;
  }
  
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } {
    const values = this.measurements.get(name) || [];
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p95: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p95: sorted[Math.floor(values.length * 0.95)]
    };
  }
  
  reset(): void {
    this.measurements.clear();
    this.startTimes.clear();
  }
}

/**
 * Memory usage tracker
 */
export class MemoryTracker {
  private baseline: NodeJS.MemoryUsage;
  private samples: NodeJS.MemoryUsage[] = [];
  
  constructor() {
    this.baseline = process.memoryUsage();
  }
  
  sample(): void {
    this.samples.push(process.memoryUsage());
  }
  
  getReport(): {
    baseline: NodeJS.MemoryUsage;
    current: NodeJS.MemoryUsage;
    delta: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      arrayBuffers: number;
    };
    peak: {
      heapUsed: number;
      heapTotal: number;
    };
  } {
    const current = process.memoryUsage();
    const peak = this.samples.reduce((peak, sample) => ({
      heapUsed: Math.max(peak.heapUsed, sample.heapUsed),
      heapTotal: Math.max(peak.heapTotal, sample.heapTotal)
    }), { heapUsed: 0, heapTotal: 0 });
    
    return {
      baseline: this.baseline,
      current,
      delta: {
        heapUsed: current.heapUsed - this.baseline.heapUsed,
        heapTotal: current.heapTotal - this.baseline.heapTotal,
        external: current.external - this.baseline.external,
        arrayBuffers: current.arrayBuffers - this.baseline.arrayBuffers
      },
      peak
    };
  }
}

/**
 * CPU usage monitor
 */
export class CPUMonitor {
  private previousCPUUsage: NodeJS.CpuUsage;
  private previousTime: number;
  
  constructor() {
    this.previousCPUUsage = process.cpuUsage();
    this.previousTime = Date.now();
  }
  
  getCPUUsage(): number {
    const currentCPUUsage = process.cpuUsage(this.previousCPUUsage);
    const currentTime = Date.now();
    const timeDelta = currentTime - this.previousTime;
    
    const totalCPUTime = (currentCPUUsage.user + currentCPUUsage.system) / 1000; // Convert to ms
    const cpuPercentage = (totalCPUTime / timeDelta) * 100;
    
    this.previousCPUUsage = process.cpuUsage();
    this.previousTime = currentTime;
    
    return cpuPercentage;
  }
}