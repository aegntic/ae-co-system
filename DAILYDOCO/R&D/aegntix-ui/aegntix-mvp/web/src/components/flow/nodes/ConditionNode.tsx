import { Handle, Position, NodeProps } from 'reactflow';
import { Shield, Code, AlertTriangle } from 'lucide-react';

interface ConditionNodeData {
  label: string;
  condition?: string;
  isValid?: boolean;
  checkCount?: number;
  successRate?: number;
}

export default function ConditionNode({ data, selected }: NodeProps<ConditionNodeData>) {
  const { 
    label, 
    condition, 
    isValid = true, 
    checkCount = 0, 
    successRate = 100 
  } = data;

  return (
    <div className={`
      relative bg-gray-800 border-2 rounded-lg p-4 min-w-[180px] transition-all
      ${selected ? 'border-yellow-400 shadow-lg shadow-yellow-400/25' : 'border-gray-600'}
    `}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-yellow-400 border-2 border-gray-800"
      />

      {/* Condition Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{label}</h3>
          <p className="text-xs text-gray-400">Condition Check</p>
        </div>
        {!isValid && (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        )}
      </div>

      {/* Condition Code */}
      {condition && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-1">
            <Code className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Expression:</span>
          </div>
          <div className="text-xs font-mono text-gray-300 bg-gray-700 rounded px-2 py-1 border">
            {condition}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Checks:</span>
          <span className="text-white font-medium">{checkCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Success Rate:</span>
          <div className="flex items-center space-x-2">
            <div className="w-12 bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${
                  successRate >= 80 ? 'bg-green-400' : 
                  successRate >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${successRate}%` }}
              />
            </div>
            <span className="text-white font-medium">{successRate}%</span>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`
        mt-3 flex items-center space-x-1 text-xs
        ${isValid ? 'text-green-400' : 'text-red-400'}
      `}>
        <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-400' : 'bg-red-400'}`} />
        <span>{isValid ? 'Valid Expression' : 'Syntax Error'}</span>
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-yellow-400 border-2 border-gray-800"
      />
    </div>
  );
}