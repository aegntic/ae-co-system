import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => {
  // Graceful port handling - try 1420, fall back to next available
  const findAvailablePort = async (startPort: number): Promise<number> => {
    const net = await import('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = (server.address() as any)?.port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        // Port busy, try next one
        findAvailablePort(startPort + 1).then(resolve);
      });
    });
  };

  const port = await findAvailablePort(1420);
  
  // Background task: Kill busy port 1420 if we had to use a different port
  if (port !== 1420) {
    import('child_process').then(({ exec }) => {
      exec('lsof -ti:1420 | xargs -r kill -9', () => {
        console.log('🔄 Cleaned up port 1420 in background');
      });
    });
  }

  return {
    plugins: [react()],
    
    // Copy public files that need to be available at runtime
    publicDir: 'public',
    
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. Use available port with graceful fallback
    server: {
      port,
      strictPort: false, // Allow port flexibility
      host: host || false,
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: port + 1,
          }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    },
  };
});
