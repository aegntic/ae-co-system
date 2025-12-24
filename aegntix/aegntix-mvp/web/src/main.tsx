import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Main CSS styles for the application

// Error Boundary Component
class ErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    // In a real app, you'd use something like Sentry, LogRocket, etc.
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Ensure your HTML has an element with id='root'.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#111827', // var(--color-bg-primary)
        color: '#f9fafb' // var(--color-text-primary)
      }}>
        <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Oops! Something went wrong.</h1>
        <p style={{ fontSize: '1.2em', marginBottom: '10px' }}>We're sorry for the inconvenience. Please try refreshing the page.</p>
        <p style={{ color: '#9ca3af' }}>If the problem persists, please contact support.</p> {/* var(--color-text-muted) */}
      </div>
    }>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
