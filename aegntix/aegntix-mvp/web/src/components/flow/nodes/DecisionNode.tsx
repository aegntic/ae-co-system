import { Handle, Position, NodeProps, Connection } from 'reactflow'; // Added Connection
import { GitFork, CheckCircle, XCircle, Settings2 } from 'lucide-react'; // Changed GitBranch to GitFork
import React, { memo } from 'react'; // Added memo

interface DecisionNodeData {
  label: string;
  condition?: string; // The condition that this decision node evaluates
  lastResult?: boolean; // The result of the last evaluation (true or false)
  evaluationCount?: number; // How many times this decision has been evaluated
}

const DecisionNode: React.FC<NodeProps<DecisionNodeData>> = memo(({ data, selected, isConnectable }) => {
  const { label, condition, lastResult, evaluationCount = 0 } = data;

  return (
    <div className={`
      node-card decision-node relative bg-[var(--color-bg-secondary)] border-2 rounded-xl p-3 sm:p-4 min-w-[200px] sm:min-w-[220px] transition-all shadow-md hover:shadow-lg
      ${selected ? 'border-[var(--color-node-decision)] shadow-[var(--color-node-decision)]/30' : 'border-[var(--color-border-primary)]'}
      transform rotate-45
    `}>
      <div className="transform -rotate-45 text-center"> {/* Counter-rotate content */}
        {/* Input Handle (Top-Left after rotation) */}
        <Handle
          type="target"
          position={Position.Top}
          className="react-flow__handle-custom handle-decision"
          isConnectable={isConnectable}
        />

        {/* Decision Header */}
        <div className="flex flex-col items-center justify-center mb-2 sm:mb-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-inner mb-1 sm:mb-1.5">
            <GitFork className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" />
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)] text-xs sm:text-sm truncate" title={label}>{label}</h3>
        </div>

        {/* Condition Display (Optional) */}
        {condition && (
          <div className="mb-2 text-left">
            <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mb-0.5">Condition:</div>
            <div
              className="text-[10px] sm:text-xs font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded px-1.5 py-0.5 border border-[var(--color-border-secondary)] max-h-10 overflow-y-auto whitespace-pre-wrap break-all"
              title={condition}
            >
              {condition}
            </div>
          </div>
        )}

        {/* Evaluation Stats */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className="text-[var(--color-text-muted)]">Evals: {evaluationCount}</span>
          {lastResult !== undefined && (
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {lastResult ? (
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
              ) : (
                <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
              )}
              <span className={`font-medium ${lastResult ? 'text-green-400' : 'text-red-400'}`}>
                {lastResult ? 'True' : 'False'}
              </span>
            </div>
          )}
        </div>

        {/* Output Handles (Right & Bottom-Right after rotation) */}
        <Handle
          type="source"
          position={Position.Right}
          id="true" // True path
          className="react-flow__handle-custom handle-decision handle-true"
          isConnectable={isConnectable}
        />
        <Handle
          type="source"
          position={Position.Bottom} // False path (Bottom-Right of diamond)
          id="false"
          className="react-flow__handle-custom handle-decision handle-false"
          isConnectable={isConnectable}
        />

        {/* Configuration Button (Example) */}
        <button
            title="Configure Decision"
            className="absolute -top-1.5 -right-1.5 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-50 hover:opacity-100"
            onClick={(e) => {
            e.stopPropagation();
            console.log(`Configure decision: ${label}`);
            }}
            style={{transform: 'rotate(-45deg)'}} // Counter-rotate the button itself
        >
            <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
export default DecisionNode;

// Add global styles for handles if not already in index.css
const handleStyle = `
  .react-flow__handle-custom.handle-decision {
    background-color: var(--color-node-decision);
    transform: rotate(-45deg); /* Counter-rotate handles */
  }
  .react-flow__handle-custom.handle-decision.handle-true {
    background-color: var(--color-accent); /* Green for true */
  }
  .react-flow__handle-custom.handle-decision.handle-false {
    background-color: var(--color-danger); /* Red for false */
  }
  .decision-node .react-flow__handle-top {
    top: -5px; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
  }
  .decision-node .react-flow__handle-right {
    right: -5px; top: 50%; transform: translate(50%, -50%) rotate(-45deg);
  }
  .decision-node .react-flow__handle-bottom {
    bottom: -5px; left: 50%; transform: translate(-50%, 50%) rotate(-45deg);
  }
  /* No Left handle for this diamond, using Top for input, Right for True, Bottom for False */
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.getElementById('custom-node-styles') || document.createElement("style");
  styleSheet.id = 'custom-node-styles';
  styleSheet.type = "text/css";
  if (!document.getElementById('custom-node-styles')) {
    styleSheet.innerText += handleStyle;
    document.head.appendChild(styleSheet);
  } else if (!styleSheet.innerText.includes('.handle-decision')) {
    styleSheet.innerText += handleStyle;
  }
}
