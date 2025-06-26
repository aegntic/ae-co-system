// Declare the shape of the API exposed by the preload script
export interface IElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, listener: (...args: any[]) => void) => () => void; // Returns a cleanup function
  removeAllListeners: (channel: string) => void;
  path: {
    basename: (p: string, ext?: string) => string;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}