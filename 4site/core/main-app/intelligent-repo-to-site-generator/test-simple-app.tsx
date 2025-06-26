import React from 'react';
import ReactDOM from 'react-dom/client';

const TestApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#0d1117', color: '#c9d1d9', minHeight: '100vh' }}>
      <h1 style={{ color: '#FFD700' }}>Project4Site Test</h1>
      <p>If you can see this, React is working!</p>
      <button style={{ backgroundColor: '#FFD700', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '5px' }}>
        Test Button
      </button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<TestApp />);