import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, CheckCircle, XCircle } from 'lucide-react';

interface DecisionNodeData {
  label: string;
  condition?: string;
  lastResult?: boolean;
  evaluationCount?: number;
}

export default function DecisionNode({ data, selected }: NodeProps<DecisionNodeData>) {
  const { label, condition, lastResult, evaluationCount = 0 } = data;

  return (
    <div className={`
      relative bg-gray-800 border-2 rounded-lg p-4 min-w-[200px] transition-all
      ${selected ? 'border-pink-400 shadow-lg shadow-pink-400/25' : 'border-gray-600'}
    `}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-pink-400 border-2 border-gray-800"
      />

      {/* Decision Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{label}</h3>
          <p className="text-xs text-gray-400">Decision Node</p>
        </div>
      </div>

      {/* Condition Display */}
      {condition && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">Condition:</div>
          <div className="text-xs font-mono text-gray-300 bg-gray-700 rounded px-2 py-1 border">
            {condition}
          </div>
        </div>
      )}

      {/* Evaluation Stats */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-gray-400">Evaluations: {evaluationCount}</span>
        {lastResult !== undefined && (
          <div className="flex items-center space-x-1">
            {lastResult ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
            <span className={lastResult ? 'text-green-400' : 'text-red-400'}>
              {lastResult ? 'True' : 'False'}
            </span>
          </div>
        )}
      </div>

      {/* Output Handles */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="true"
        className="w-3 h-3 bg-green-400 border-2 border-gray-800"
        style={{ top: '60%' }}
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="false"
        className="w-3 h-3 bg-red-400 border-2 border-gray-800"
        style={{ top: '60%' }}
      />

      {/* Labels for outputs */}
      <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
        <span className="text-xs text-green-400 font-medium">True</span>
      </div>
      <div className="absolute -left-12 top-1/2 transform -translate-y-1/2">
        <span className="text-xs text-red-400 font-medium">False</span>
      </div>
    </div>
  );
}