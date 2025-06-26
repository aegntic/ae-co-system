import React from 'react';

interface AIModel {
  id: string;
  name: string;
  isLoggedIn: boolean;
}

interface ModelSelectorProps {
  models: AIModel[];
  selectedModels: string[];
  onToggleModel: (modelId: string) => void;
  onLoginRequest: (modelId: string) => void;
  currentLoginModel: string | null;
  onCancelLogin: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModels, 
  onToggleModel,
  onLoginRequest,
  currentLoginModel,
  onCancelLogin
}) => {
  return (
    <div className="model-selector">
      <h2>AI Models</h2>
      <div className="model-list">
        {models.map(model => (
          <div 
            key={model.id} 
            className={`model-item ${selectedModels.includes(model.id) ? 'selected' : ''} ${model.isLoggedIn ? 'logged-in' : ''}`}
          >
            <div className="model-checkbox">
              <input 
                type="checkbox" 
                checked={selectedModels.includes(model.id)} 
                onChange={() => onToggleModel(model.id)}
                id={`model-${model.id}`}
              />
            </div>
            <div className="model-info">
              <label htmlFor={`model-${model.id}`}>{model.name}</label>
              <div className="model-status">
                {model.isLoggedIn ? 'Connected' : 'Not Connected'}
              </div>
            </div>
            <div className="model-actions">
              {!model.isLoggedIn && (
                <button 
                  className="login-action"
                  onClick={() => onLoginRequest(model.id)}
                  disabled={currentLoginModel !== null}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {currentLoginModel && (
        <div className="login-overlay">
          <div className="login-dialog">
            <p>Logging in to {models.find(m => m.id === currentLoginModel)?.name}...</p>
            <p>Please complete the login process in the browser window.</p>
            <button onClick={onCancelLogin}>Cancel</button>
          </div>
        </div>
      )}
      
      <div className="connections-section">
        <p className="connections-status">
          {models.filter(m => m.isLoggedIn).length} of {models.length} services connected
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;
