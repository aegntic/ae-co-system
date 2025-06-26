import React, { useState } from 'react';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Idle);

  return (
    <div className="min-h-screen bg-gh-bg-primary text-gh-text-primary p-8">
      <h1 className="text-4xl font-bold text-wu-gold mb-4">Project4Site</h1>
      <p className="text-xl mb-8">AI-Powered GitHub Repository to Website Generator</p>
      <div className="bg-gh-bg-secondary p-6 rounded-lg border border-gh-border-default">
        <p>App State: {appState}</p>
        <div className="mt-4 space-x-4">
          <button 
            onClick={() => setAppState(AppState.Loading)}
            className="bg-wu-gold text-black px-6 py-3 rounded-lg hover:bg-wu-gold-muted transition-colors"
          >
            Set Loading
          </button>
          <button 
            onClick={() => setAppState(AppState.Success)}
            className="bg-wu-gold text-black px-6 py-3 rounded-lg hover:bg-wu-gold-muted transition-colors"
          >
            Set Success
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;