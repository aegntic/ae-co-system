import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', () => {
      resolve(false);
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port starting from the preferred port
 */
export async function findAvailablePort(
  preferredPort: number,
  maxAttempts: number = 10
): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  // If no port found in range, find a random available port
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Kill process using a specific port
 */
export async function killProcessOnPort(port: number): Promise<void> {
  try {
    // Find process using the port
    const { stdout } = await execAsync(
      `lsof -ti:${port} || echo ""`
    );
    
    const pid = stdout.trim();
    if (pid) {
      // Kill the process
      await execAsync(`kill -9 ${pid}`);
      console.log(`Killed process ${pid} on port ${port}`);
    }
  } catch (error) {
    console.error(`Error killing process on port ${port}:`, error);
  }
}

/**
 * Get process info for a port
 */
export async function getProcessOnPort(port: number): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `lsof -i:${port} | grep LISTEN | awk '{print $1, $2}' || echo ""`
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Service port configuration with automatic fallback
 */
export interface ServicePort {
  name: string;
  preferredPort: number;
  actualPort?: number;
}

export class PortManager {
  private services: Map<string, ServicePort> = new Map();
  
  constructor(private defaultPorts: Record<string, number>) {
    Object.entries(defaultPorts).forEach(([name, port]) => {
      this.services.set(name, { name, preferredPort: port });
    });
  }
  
  async allocatePorts(killExisting: boolean = false): Promise<Record<string, number>> {
    const allocatedPorts: Record<string, number> = {};
    
    for (const [name, service] of this.services) {
      const processInfo = await getProcessOnPort(service.preferredPort);
      
      if (processInfo) {
        console.log(`⚠️  Port ${service.preferredPort} is in use by: ${processInfo}`);
        
        if (killExisting) {
          console.log(`🔪 Killing process on port ${service.preferredPort}...`);
          await killProcessOnPort(service.preferredPort);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for port to be released
        }
      }
      
      const availablePort = await findAvailablePort(service.preferredPort);
      service.actualPort = availablePort;
      allocatedPorts[name] = availablePort;
      
      if (availablePort !== service.preferredPort) {
        console.log(`🔄 ${name}: Port ${service.preferredPort} → ${availablePort}`);
      } else {
        console.log(`✅ ${name}: Port ${availablePort} available`);
      }
    }
    
    return allocatedPorts;
  }
  
  getPort(serviceName: string): number {
    const service = this.services.get(serviceName);
    return service?.actualPort || service?.preferredPort || 0;
  }
  
  getAllPorts(): Record<string, number> {
    const ports: Record<string, number> = {};
    this.services.forEach((service, name) => {
      ports[name] = service.actualPort || service.preferredPort;
    });
    return ports;
  }
}

// Default service ports
export const DEFAULT_PORTS = {
  frontend: 5173,
  apiGateway: 4000,
  githubApp: 3001,
  aiPipeline: 3002,
  siteGenerator: 3000,
  deployment: 3003,
  commission: 3004,
  videoGenerator: 3005,
  pgAdmin: 5050,
  redisCommander: 8081,
  mailhog: 8025,
};

// Create singleton instance
export const portManager = new PortManager(DEFAULT_PORTS);