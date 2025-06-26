import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gh-bg-primary text-gh-text-primary p-8">
      <h1 className="text-4xl font-bold text-wu-gold mb-4">Project4Site</h1>
      <p className="text-xl mb-8">AI-Powered GitHub Repository to Website Generator</p>
      <div className="bg-gh-bg-secondary p-6 rounded-lg border border-gh-border-default">
        <p>If you can see this, the app is working!</p>
        <button className="mt-4 bg-wu-gold text-black px-6 py-3 rounded-lg hover:bg-wu-gold-muted transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default App;