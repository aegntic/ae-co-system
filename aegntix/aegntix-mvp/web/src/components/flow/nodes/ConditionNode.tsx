import { Handle, Position, NodeProps, Connection } from 'reactflow'; // Added Connection
import { ShieldCheck, Code, AlertTriangle, Settings2 } from 'lucide-react'; // Changed Shield to ShieldCheck
import React, { memo } from 'react'; // Added memo

interface ConditionNodeData {
  label: string;
  condition?: string; // e.g., "variable_x > 10 && status === 'active'"
  isValid?: boolean; // Whether the condition syntax is currently valid
  checkCount?: number; // How many times this condition has been evaluated
  successRate?: number; // Percentage of times it evaluated to true (if applicable)
}

const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = memo(({ data, selected, isConnectable }) => {
  const {
    label,
    condition,
    isValid = true,
    checkCount = 0,
    successRate = 100
  } = data;

  return (
    <div className={`
      node-card condition-node relative bg-[var(--color-bg-secondary)] border-2 rounded-xl p-3 sm:p-4 min-w-[200px] sm:min-w-[220px] transition-all shadow-md hover:shadow-lg
      ${selected ? 'border-[var(--color-node-condition)] shadow-[var(--color-node-condition)]/30' : 'border-[var(--color-border-primary)]'}
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="react-flow__handle-custom handle-condition"
        isConnectable={isConnectable}
      />

      {/* Condition Header */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base truncate" title={label}>{label}</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Condition Check</p>
        </div>
        {!isValid && (
          <AlertTriangle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-400 flex-shrink-0" title="Invalid Condition Syntax" />
        )}
      </div>

      {/* Condition Code/Expression */}
      {condition && (
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center space-x-1 mb-1 sm:mb-1.5">
            <Code className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
            <span className="text-xs text-[var(--color-text-muted)]">Expression:</span>
          </div>
          <div
            className="text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded-md px-2 py-1.5 border border-[var(--color-border-secondary)] max-h-20 overflow-y-auto whitespace-pre-wrap break-all"
            title={condition}
          >
            {condition}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-1 sm:space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">Evaluations:</span>
          <span className="text-[var(--color-text-primary)] font-medium">{checkCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">Success Rate:</span>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-10 sm:w-12 bg-[var(--color-bg-tertiary)] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  successRate >= 80 ? 'bg-green-400' :
                  successRate >= 50 ? 'bg-yellow-400' : 'bg-red-400' // Adjusted threshold
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
            <span className="text-[var(--color-text-primary)] font-medium">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`
        mt-2 sm:mt-3 flex items-center space-x-1 text-xs
        ${isValid ? 'text-green-400' : 'text-red-400'}
      `}>
        <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-400' : 'bg-red-400'}`} />
        <span>{isValid ? 'Valid Expression' : 'Syntax Error'}</span>
      </div>

      {/* Output Handles (True/False) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true" // Specific ID for true path
        className="react-flow__handle-custom handle-condition handle-true"
        style={{ left: '25%' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false" // Specific ID for false path
        className="react-flow__handle-custom handle-condition handle-false"
        style={{ left: '75%' }}
        isConnectable={isConnectable}
      />

      {/* Labels for output handles */}
      <div className="absolute -bottom-5 left-1/4 transform -translate-x-1/2 text-xs text-green-400">True</div>
      <div className="absolute -bottom-5 left-3/4 transform -translate-x-1/2 text-xs text-red-400">False</div>


       {/* Configuration Button (Example) */}
      <button
        title="Configure Condition"
        className="absolute top-1 right-1 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-50 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          console.log(`Configure condition: ${label}`);
        }}
      >
        <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
export default ConditionNode;

// Add global styles for handles if not already in index.css
const handleStyle = `
  .react-flow__handle-custom.handle-condition {
    background-color: var(--color-node-condition);
  }
  .react-flow__handle-custom.handle-condition.handle-true {
    background-color: var(--color-accent); /* Green for true */
  }
  .react-flow__handle-custom.handle-condition.handle-false {
    background-color: var(--color-danger); /* Red for false */
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.getElementById('custom-node-styles') || document.createElement("style");
  styleSheet.id = 'custom-node-styles';
  styleSheet.type = "text/css";
  if (!document.getElementById('custom-node-styles')) { // Append only if not already present
    styleSheet.innerText += handleStyle; // Append to existing styles if any
    document.head.appendChild(styleSheet);
  } else if (!styleSheet.innerText.includes('.handle-condition')) {
    styleSheet.innerText += handleStyle;
  }
}
