import React, { useState, useEffect } from 'react';

interface Response {
  modelId: string;
  modelName: string;
  content: string;
  isComplete?: boolean;
  error?: boolean;
  timestamp: number;
}

interface ResponseViewProps {
  responses: Record<string, Response>;
  isLoading: boolean;
  selectedModels: string[];
  onExportToObsidian: () => void;
  viewMode?: 'tabs' | 'split';
}

const ResponseView: React.FC<ResponseViewProps> = ({ 
  responses, 
  isLoading, 
  selectedModels,
  onExportToObsidian,
  viewMode: propViewMode = 'tabs'
}) => {
  const [viewMode, setViewMode] = useState<'tabs' | 'split'>(propViewMode);
  
  // Update view mode if prop changes
  useEffect(() => {
    setViewMode(propViewMode);
  }, [propViewMode]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Set active tab when responses change
  useEffect(() => {
    const responseIds = Object.keys(responses);
    if (responseIds.length > 0 && (!activeTab || !responseIds.includes(activeTab))) {
      const firstResponseId = responseIds[0];
      if (firstResponseId) {
        setActiveTab(firstResponseId);
      }
    }
  }, [responses, activeTab]);

  const renderTabs = () => {
    return (
      <div className="tabs-response-view">
        <div className="tabs-header">
          {Object.values(responses).map(response => (
            <div
              key={response.modelId}
              className={`tab ${activeTab === response.modelId ? 'active' : ''} ${response.error ? 'error' : ''} ${!response.isComplete && !response.error ? 'streaming' : ''}`}
              onClick={() => setActiveTab(response.modelId)}
            >
              {response.modelName}
              {!response.isComplete && !response.error && (
                <span className="streaming-indicator">...</span>
              )}
            </div>
          ))}
        </div>
        <div className="tab-content">
          {activeTab && responses[activeTab] ? (() => {
            const currentResponse = responses[activeTab];
            if (!currentResponse) return null;
            
            return (
              <div className={`response-content ${currentResponse.error ? 'error' : ''}`}>
                {currentResponse.content}
                {!currentResponse.isComplete && !currentResponse.error && (
                  <span className="streaming-cursor"></span>
                )}
              </div>
            );
          })() : (
            <div className="no-response">
              No response selected
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSplit = () => {
    return (
      <div className="split-response-view">
        {Object.values(responses).length > 0 ? (
          <div className="split-grid" style={{ 
            gridTemplateColumns: `repeat(${Math.min(Object.values(responses).length, 3)}, 1fr)` 
          }}>
            {Object.values(responses).map(response => (
              <div key={response.modelId} className={`split-item ${response.error ? 'error' : ''}`}>
                <div className={`split-header ${!response.isComplete && !response.error ? 'streaming' : ''}`}>
                  {response.modelName}
                  {!response.isComplete && !response.error && (
                    <span className="streaming-indicator">...</span>
                  )}
                </div>
                <div className="split-content">
                  {response.content}
                  {!response.isComplete && !response.error && (
                    <span className="streaming-cursor"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-responses">
            No responses yet
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="response-view-container">
      <div className="response-view-header">
        <div className="view-mode-selector">
          <button
            className={`view-mode-button ${viewMode === 'tabs' ? 'active' : ''}`}
            onClick={() => setViewMode('tabs')}
          >
            Tabs
          </button>
          <button
            className={`view-mode-button ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            Split View
          </button>
        </div>
        
        <div className="response-status">
          {isLoading && (
            <div className="streaming-badge">
              <span className="streaming-dot"></span>
              Generating...
            </div>
          )}
        </div>
      </div>
      
      <div className="response-view-content">
        {isLoading && Object.keys(responses).length === 0 ? (
          <div className="loading-state">
            {selectedModels.length > 0 ? (
              <div>
                <div className="loading-spinner"></div>
                <div>Waiting for responses from {selectedModels.length} model(s)...</div>
              </div>
            ) : (
              <div>Please select at least one AI model</div>
            )}
          </div>
        ) : Object.keys(responses).length > 0 ? (
          viewMode === 'tabs' ? renderTabs() : renderSplit()
        ) : (
          <div className="empty-state">
            <p>No responses yet. Select AI models and send a prompt to see responses here.</p>
          </div>
        )}
      </div>

      <div className="response-view-actions">
        <div className="action-info">
          {Object.values(responses).filter(r => !r.isComplete && !r.error).length > 0 && (
            <span className="streaming-info">
              <span className="streaming-dot"></span>
              Responses are still being generated...
            </span>
          )}
        </div>
        <button 
          className="export-button" 
          disabled={Object.keys(responses).length === 0}
          onClick={onExportToObsidian}
        >
          Export to Obsidian
        </button>
      </div>
    </div>
  );
};

export default ResponseView;
