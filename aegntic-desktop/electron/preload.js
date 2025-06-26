const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Expose ipcRenderer invoke/on/removeAllListeners
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, listener) => {
    // Wrap the listener to ensure it's properly handled
    const wrappedListener = (event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrappedListener);
    // Return a function to remove the listener
    return () => ipcRenderer.removeListener(channel, wrappedListener);
  },
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  clearConversation: () => ipcRenderer.invoke('clear-conversation'), // Add this line

  // Expose specific Node.js modules needed by the frontend
  path: {
    basename: (p, ext) => path.basename(p, ext)
  }
});

console.log('Preload script loaded.');