import { Handle, Position, NodeProps } from 'reactflow';
import { User, Brain, Target, Activity } from 'lucide-react';

interface AgentNodeData {
  agentConfig: {
    id: string;
    role: string;
    personality: {
      traits: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
      };
    };
    goals: string[];
  };
  label: string;
  isActive?: boolean;
  performance?: number;
}

export default function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  const { agentConfig, isActive = false, performance = 85 } = data;
  const { personality } = agentConfig;

  // Calculate dominant personality trait
  const traits = personality.traits;
  const dominantTrait = Object.entries(traits).reduce((max, [key, value]) => 
    value > max.value ? { key, value } : max, 
    { key: '', value: 0 }
  );

  // Get personality color based on dominant trait
  const getPersonalityColor = (trait: string) => {
    switch (trait) {
      case 'openness': return 'from-purple-500 to-blue-500';
      case 'conscientiousness': return 'from-blue-500 to-green-500';
      case 'extraversion': return 'from-yellow-500 to-orange-500';
      case 'agreeableness': return 'from-green-500 to-teal-500';
      case 'neuroticism': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`
      relative bg-gray-800 border-2 rounded-lg p-4 min-w-[240px] transition-all
      ${selected ? 'border-blue-400 shadow-lg shadow-blue-400/25' : 'border-gray-600'}
      ${isActive ? 'ring-2 ring-green-400 ring-opacity-50' : ''}
    `}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-blue-400 border-2 border-gray-800"
      />

      {/* Agent Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`
          w-10 h-10 rounded-full bg-gradient-to-br ${getPersonalityColor(dominantTrait.key)}
          flex items-center justify-center
        `}>
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{agentConfig.role}</h3>
          <p className="text-xs text-gray-400 capitalize">{dominantTrait.key}</p>
        </div>
        {isActive && (
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-green-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Personality Visualization */}
      <div className="mb-3">
        <div className="flex items-center space-x-1 mb-2">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-gray-400">Personality</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {Object.entries(traits).map(([trait, value]) => (
            <div key={trait} className="text-center">
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 uppercase">
                {trait.slice(0, 1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="mb-3">
        <div className="flex items-center space-x-1 mb-2">
          <Target className="w-3 h-3 text-green-400" />
          <span className="text-xs text-gray-400">Goals ({agentConfig.goals.length})</span>
        </div>
        <div className="space-y-1">
          {agentConfig.goals.slice(0, 2).map((goal, index) => (
            <div key={index} className="text-xs text-gray-300 bg-gray-700 rounded px-2 py-1 truncate">
              {goal}
            </div>
          ))}
          {agentConfig.goals.length > 2 && (
            <div className="text-xs text-gray-400">
              +{agentConfig.goals.length - 2} more
            </div>
          )}
        </div>
      </div>

      {/* Performance */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Performance</span>
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all ${
                performance >= 80 ? 'bg-green-400' : 
                performance >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${performance}%` }}
            />
          </div>
          <span className="text-white font-medium">{performance}%</span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-400 border-2 border-gray-800"
      />

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      )}
    </div>
  );
}