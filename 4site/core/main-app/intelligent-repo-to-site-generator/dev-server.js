#!/usr/bin/env node

import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import net from 'net';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if port is available
async function isPortAvailable(port) {
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

// Find available port
async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 100; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return 0; // Let OS assign
}

// Get process info on port
async function getProcessOnPort(port) {
  return new Promise((resolve) => {
    const lsof = spawn('lsof', ['-i', `:${port}`]);
    let output = '';
    
    lsof.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    lsof.on('close', () => {
      const lines = output.split('\n');
      const processLine = lines.find(line => line.includes('LISTEN'));
      if (processLine) {
        const parts = processLine.split(/\s+/);
        resolve({ command: parts[0], pid: parts[1] });
      } else {
        resolve(null);
      }
    });
  });
}

async function startDevServer() {
  console.log('🚀 Starting Project4Site Development Server\n');
  
  const preferredPort = 5173;
  let port = preferredPort;
  
  // Check if preferred port is available
  if (!await isPortAvailable(preferredPort)) {
    const processInfo = await getProcessOnPort(preferredPort);
    if (processInfo) {
      console.log(`⚠️  Port ${preferredPort} is in use by ${processInfo.command} (PID: ${processInfo.pid})`);
    }
    
    // Find an available port
    port = await findAvailablePort(preferredPort);
    console.log(`✅ Using port ${port} instead\n`);
  }
  
  // Create Vite server
  const server = await createServer({
    configFile: false,
    root: __dirname,
    plugins: [react()],
    server: {
      port,
      host: true,
      open: false,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': __dirname,
      },
    },
  });
  
  await server.listen();
  
  const info = server.config.server;
  const protocol = info.https ? 'https' : 'http';
  const host = 'localhost';
  
  console.log(`  ➜  Local:   ${protocol}://${host}:${port}/`);
  console.log(`  ➜  Network: ${protocol}://${info.host || 'localhost'}:${port}/`);
  
  if (port !== preferredPort) {
    console.log(`\n  💡 Tip: To use port ${preferredPort}, stop the process using it or run with --kill flag`);
  }
  
  console.log('\n  Press Ctrl+C to stop\n');
}

// Handle --kill flag
if (process.argv.includes('--kill')) {
  console.log('🔪 Killing processes on port 5173...');
  spawn('lsof', ['-ti', ':5173']).stdout.on('data', (data) => {
    const pid = data.toString().trim();
    if (pid) {
      spawn('kill', ['-9', pid]);
      console.log(`Killed process ${pid}`);
    }
  });
  
  // Wait a moment before starting
  setTimeout(() => startDevServer(), 1000);
} else {
  startDevServer();
}