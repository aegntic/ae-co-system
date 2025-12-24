import { Handle, Position, NodeProps, Connection } from 'reactflow'; // Added Connection
import { User, Brain, Target, Activity, Settings2 } from 'lucide-react'; // Added Settings2 for config
import React, { memo } from 'react'; // Added memo

// Define a more specific type for agentConfig's personality traits
interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  // Allow other traits dynamically
  [key: string]: number;
}

interface AgentConfig {
  id: string;
  role: string;
  personality: {
    traits: PersonalityTraits;
  };
  goals: string[];
}

interface AgentNodeData {
  agentConfig: AgentConfig;
  label: string; // This should be the role or a custom label
  isActive?: boolean;
  performance?: number; // e.g., 0-100
}

// Memoize the component for performance optimization if props don't change
const AgentNode: React.FC<NodeProps<AgentNodeData>> = memo(({ data, selected, isConnectable }) => {
  const { agentConfig, isActive = false, performance = 85 } = data;
  const { personality, role, goals } = agentConfig;

  // Calculate dominant personality trait
  const traits = personality?.traits || {};
  const dominantTraitEntry = Object.entries(traits).reduce(
    (max, entry) => (entry[1] > max.value ? { key: entry[0], value: entry[1] } : max),
    { key: 'unknown', value: -1 }
  );
  const dominantTrait = dominantTraitEntry.key;


  // Get personality color based on dominant trait
  const getPersonalityColor = (trait: string): string => {
    switch (trait) {
      case 'openness': return 'bg-gradient-to-br from-purple-500 to-indigo-500';
      case 'conscientiousness': return 'bg-gradient-to-br from-blue-500 to-sky-500';
      case 'extraversion': return 'bg-gradient-to-br from-yellow-400 to-amber-500';
      case 'agreeableness': return 'bg-gradient-to-br from-green-400 to-emerald-500';
      case 'neuroticism': return 'bg-gradient-to-br from-red-500 to-rose-500';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
    }
  };

  const MAX_GOALS_DISPLAY = 2;

  return (
    <div className={`
      node-card agent-node relative bg-[var(--color-bg-secondary)] border-2 rounded-xl p-3 sm:p-4 min-w-[220px] sm:min-w-[240px] transition-all shadow-md hover:shadow-lg
      ${selected ? 'border-[var(--color-node-agent)] shadow-[var(--color-node-agent)]/30' : 'border-[var(--color-border-primary)]'}
      ${isActive ? 'ring-2 ring-green-400 ring-opacity-75' : ''}
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="react-flow__handle-custom"
        isConnectable={isConnectable}
      />

      {/* Agent Header */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className={`
          flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getPersonalityColor(dominantTrait)}
          flex items-center justify-center shadow-inner
        `}>
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base truncate" title={role}>{role}</h3>
          <p className="text-xs text-[var(--color-text-muted)] capitalize truncate" title={dominantTrait}>{dominantTrait} Driven</p>
        </div>
        {isActive && (
          <div className="flex-shrink-0 flex items-center space-x-1" title="Active">
            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Personality Visualization */}
      {Object.keys(traits).length > 0 && (
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
            <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">Personality</span>
          </div>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1">
            {Object.entries(traits).map(([trait, value]) => (
              <div key={trait} className="text-center" title={`${trait}: ${value.toFixed(1)}`}>
                <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-1 sm:h-1.5 mb-0.5 sm:mb-1 overflow-hidden">
                  <div
                    className="bg-[var(--color-node-agent)] h-full rounded-full transition-all duration-300"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 uppercase">
                  {trait.slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {goals && goals.length > 0 && (
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
            <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 flex-shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">Goals ({goals.length})</span>
          </div>
          <div className="space-y-1">
            {goals.slice(0, MAX_GOALS_DISPLAY).map((goal, index) => (
              <div key={index} className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded px-1.5 sm:px-2 py-0.5 sm:py-1 truncate" title={goal}>
                {goal}
              </div>
            ))}
            {goals.length > MAX_GOALS_DISPLAY && (
              <div className="text-xs text-[var(--color-text-muted)]">
                +{goals.length - MAX_GOALS_DISPLAY} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance */}
      {performance !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">Performance</span>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-12 sm:w-16 bg-[var(--color-bg-tertiary)] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  performance >= 80 ? 'bg-green-400' :
                  performance >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${performance}%` }}
              />
            </div>
            <span className="text-[var(--color-text-primary)] font-medium">{performance}%</span>
          </div>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="react-flow__handle-custom"
        isConnectable={isConnectable}
      />

      {/* Configuration Button (Example) */}
      <button
        title="Configure Agent"
        className="absolute top-1 right-1 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-50 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation(); // Prevent node click
          console.log(`Configure agent: ${agentConfig.id}`);
          // Potentially open a modal or side panel here
        }}
      >
        <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
});

// Add a display name for better debugging in React DevTools
AgentNode.displayName = 'AgentNode';

export default AgentNode;

// Add global styles for handles if not already in index.css
const handleStyle = `
  .react-flow__handle-custom {
    width: 10px;
    height: 10px;
    background-color: var(--color-node-agent);
    border: 2px solid var(--color-bg-secondary);
  }
  .react-flow__handle-custom.connecting {
    background-color: var(--color-accent);
  }
  .node-card { /* Base class for all custom nodes for consistency */
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = handleStyle;
  document.head.appendChild(styleSheet);
}
