import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import { Node } from 'reactflow';
import { X, User, GitFork, Zap, ShieldCheck, Save, Trash2, Eye, EyeOff } from 'lucide-react'; // Added Trash2, Eye, EyeOff

interface NodePanelProps {
  node: Node | null; // Allow null for when no node is selected
  onClose: () => void;
  onUpdate: (nodeId: string, newData: any) => void; // Pass nodeId for clarity
  onDelete?: (nodeId: string) => void; // Optional delete handler
}

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};


export default function NodePanel({ node, onClose, onUpdate, onDelete }: NodePanelProps) {
  const [localNodeData, setLocalNodeData] = useState(node?.data || {});
  const [isRawVisible, setIsRawVisible] = useState(false);

  useEffect(() => {
    setLocalNodeData(node?.data || {});
  }, [node]);

  // Debounced update function
  const debouncedUpdate = useCallback(debounce((nodeId, data) => {
    onUpdate(nodeId, data);
  }, 500), [onUpdate]);


  const handleInputChange = (key: string, value: any) => {
    const newData = { ...localNodeData, [key]: value };
    setLocalNodeData(newData);
    if (node) {
      debouncedUpdate(node.id, newData);
    }
  };

  const handleAgentConfigChange = (configKey: string, value: any) => {
    const newAgentConfig = { ...(localNodeData.agentConfig || {}), [configKey]: value };
    handleInputChange('agentConfig', newAgentConfig);
  };

  const handlePersonalityTraitChange = (trait: string, value: number) => {
    const newTraits = { ...(localNodeData.agentConfig?.personality?.traits || {}), [trait]: value };
    const newPersonality = { ...(localNodeData.agentConfig?.personality || {}), traits: newTraits };
    handleAgentConfigChange('personality', newPersonality);
  };

  const handleGoalChange = (index: number, value: string) => {
    const newGoals = [...(localNodeData.agentConfig?.goals || [])];
    newGoals[index] = value;
    handleAgentConfigChange('goals', newGoals);
  };

  const addGoal = () => {
    const newGoals = [...(localNodeData.agentConfig?.goals || []), 'New Goal'];
    handleAgentConfigChange('goals', newGoals);
  };

  const removeGoal = (index: number) => {
    const newGoals = (localNodeData.agentConfig?.goals || []).filter((_:any, i:number) => i !== index);
    handleAgentConfigChange('goals', newGoals);
  };


  const getNodeIcon = () => {
    if (!node) return Settings2; // Default icon
    switch (node.type) {
      case 'agent': return User;
      case 'decision': return GitFork;
      case 'event': return Zap;
      case 'condition': return ShieldCheck;
      default: return Settings2; // Fallback icon
    }
  };

  const NodeIcon = getNodeIcon();

  if (!node) {
    return (
      <div className="w-72 sm:w-80 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] h-full flex flex-col p-4 items-center justify-center text-[var(--color-text-muted)]">
        <Zap className="w-10 h-10 mb-4" />
        <p className="text-sm text-center">Select a node to edit its properties.</p>
      </div>
    );
  }

  const renderAgentEditor = () => {
    if (node.type !== 'agent' || !localNodeData.agentConfig) return null;
    const { agentConfig } = localNodeData;
    const traits = agentConfig.personality?.traits || {};

    return (
      <div className="space-y-4">
        <InputField label="Agent Role" value={agentConfig.role || ''} onChange={(val) => {
            handleAgentConfigChange('role', val);
            handleInputChange('label', val); // Also update node label
        }} />

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Personality Traits</label>
          <div className="space-y-2.5">
            {Object.entries(traits).map(([trait, value]) => (
              <RangeField
                key={trait}
                label={trait.charAt(0).toUpperCase() + trait.slice(1)}
                value={value as number}
                onChange={(val) => handlePersonalityTraitChange(trait, val)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">Goals</label>
          <div className="space-y-1.5">
            {(agentConfig.goals || []).map((goal: string, index: number) => (
              <div key={index} className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => handleGoalChange(index, e.target.value)}
                  className="input-field flex-1 text-sm"
                  placeholder={`Goal ${index + 1}`}
                />
                <button
                  onClick={() => removeGoal(index)}
                  className="p-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors"
                  title="Remove Goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addGoal}
              className="w-full px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-primary)] text-[var(--color-text-muted)] rounded-md border border-dashed border-[var(--color-border-secondary)] transition-colors text-sm"
            >
              + Add Goal
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGenericEditor = () => {
    return (
      <div className="space-y-3">
        <InputField label="Label" value={localNodeData.label || ''} onChange={(val) => handleInputChange('label', val)} />

        {localNodeData.condition !== undefined && (
          <TextareaField label="Condition" value={localNodeData.condition || ''} onChange={(val) => handleInputChange('condition', val)} placeholder="Enter condition expression..."/>
        )}

        {localNodeData.eventType !== undefined && (
          <SelectField
            label="Event Type"
            value={localNodeData.eventType || 'trigger'}
            onChange={(val) => handleInputChange('eventType', val)}
            options={[
              { value: 'trigger', label: 'Trigger' },
              { value: 'interrupt', label: 'Interrupt' },
              { value: 'broadcast', label: 'Broadcast' },
              { value: 'milestone', label: 'Milestone' },
            ]}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-72 sm:w-80 bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-[var(--color-node-agent)] flex items-center justify-center"> {/* Generic icon color */}
              <NodeIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white/90" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base">Edit {node.type} Node</h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate" title={node.id}>ID: {node.id.substring(0,15)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors rounded-md hover:bg-[var(--color-bg-tertiary)]"
            title="Close Panel"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4">
        {node.type === 'agent' ? renderAgentEditor() : renderGenericEditor()}

        {/* Raw Data Viewer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border-primary)]">
            <button
                onClick={() => setIsRawVisible(!isRawVisible)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center space-x-1"
            >
                {isRawVisible ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                <span>{isRawVisible ? 'Hide' : 'Show'} Raw Data</span>
            </button>
            {isRawVisible && (
                <pre className="mt-2 text-xs p-2 bg-[var(--color-bg-deep-space)] text-[var(--color-text-secondary)] rounded-md max-h-48 overflow-auto">
                    {JSON.stringify(localNodeData, null, 2)}
                </pre>
            )}
        </div>
      </div>


      {/* Actions - Removed Save button as updates are debounced */}
       <div className="p-3 sm:p-4 border-t border-[var(--color-border-primary)]">
        {onDelete && (
             <button
                onClick={() => onDelete(node.id)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-md transition-colors text-sm font-medium"
                title="Delete Node"
            >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Node</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Helper components for form fields for consistency
const InputField: React.FC<{label: string, value: string, onChange: (value: string) => void, type?: string, placeholder?: string}> =
({label, value, onChange, type = "text", placeholder}) => (
  <div>
    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label}
           className="input-field w-full text-sm" />
  </div>
);

const TextareaField: React.FC<{label: string, value: string, onChange: (value: string) => void, placeholder?: string, rows?: number}> =
({label, value, onChange, placeholder, rows = 3}) => (
    <div>
        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || label} rows={rows}
                  className="input-field w-full text-sm font-mono"/>
    </div>
);

const RangeField: React.FC<{label: string, value: number, onChange: (value: number) => void, min?:number, max?:number, step?:number}> =
({label, value, onChange, min=0, max=1, step=0.1}) => (
  <div>
    <div className="flex justify-between items-center mb-0.5">
      <span className="text-xs text-[var(--color-text-muted)] capitalize">{label}</span>
      <span className="text-xs text-[var(--color-text-primary)] font-medium">{value.toFixed(1)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
           onChange={(e) => onChange(parseFloat(e.target.value))}
           className="w-full h-2 bg-[var(--color-bg-tertiary)] rounded-lg appearance-none cursor-pointer slider accent-[var(--color-node-agent)]" />
  </div>
);

const SelectField: React.FC<{label: string, value: string, onChange: (value: string) => void, options: {value: string, label: string}[]}> =
({label, value, onChange, options}) => (
    <div>
        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field w-full text-sm">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

// Ensure input-field class is defined in index.css or here
const globalStyles = `
  .input-field {
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-primary);
    padding: 0.4rem 0.6rem; /* Adjusted padding */
    border-radius: 4px; /* Smaller radius */
    transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }
  .input-field:focus {
    outline: none;
    border-color: var(--color-focus-ring);
    box-shadow: 0 0 0 1.5px var(--color-focus-ring); /* Adjusted focus ring */
  }
  /* Styling for range input thumb */
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: var(--color-primary);
    cursor: pointer;
    border-radius: 50%;
  }
  .slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--color-primary);
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.getElementById('custom-node-styles') || document.createElement("style");
  styleSheet.id = 'custom-node-styles'; // Ensure it has an ID to check for existence
  styleSheet.type = "text/css";
  if (!document.getElementById('custom-node-styles')) {
    styleSheet.innerText += globalStyles; // Append to existing styles if any
    document.head.appendChild(styleSheet);
  } else if (!styleSheet.innerText.includes('.input-field')) { // Check if specific style is missing
     styleSheet.innerText += globalStyles;
  }
}
