import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-Fixed';
import { MockAuthProvider } from './contexts/MockAuthContext';

console.log('Index-fixed.tsx loading...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('Root element found:', rootElement);

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created');
  
  root.render(
    <React.StrictMode>
      <MockAuthProvider>
        <App />
      </MockAuthProvider>
    </React.StrictMode>
  );
  
  console.log('Fixed app rendered successfully');
} catch (error) {
  console.error('Error rendering fixed app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; background: #161b22; color: #ef4444; font-family: monospace;">
      <h1>Error Loading App</h1>
      <pre>${error}</pre>
    </div>
  `;
}