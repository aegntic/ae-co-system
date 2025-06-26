import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Clock, Users } from 'lucide-react';

interface EventNodeData {
  label: string;
  eventType?: string;
  triggerCount?: number;
  lastTriggered?: string;
  affectedAgents?: number;
}

export default function EventNode({ data, selected }: NodeProps<EventNodeData>) {
  const { 
    label, 
    eventType = 'trigger', 
    triggerCount = 0, 
    lastTriggered, 
    affectedAgents = 0 
  } = data;

  const getEventColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'from-green-500 to-emerald-600';
      case 'interrupt': return 'from-yellow-500 to-orange-600';
      case 'broadcast': return 'from-blue-500 to-cyan-600';
      case 'milestone': return 'from-purple-500 to-violet-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`
      relative bg-gray-800 border-2 rounded-lg p-4 min-w-[180px] transition-all
      ${selected ? 'border-green-400 shadow-lg shadow-green-400/25' : 'border-gray-600'}
    `}>
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-green-400 border-2 border-gray-800"
      />

      {/* Event Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`
          w-8 h-8 rounded-full bg-gradient-to-br ${getEventColor(eventType)}
          flex items-center justify-center
        `}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">{label}</h3>
          <p className="text-xs text-gray-400 capitalize">{eventType} Event</p>
        </div>
      </div>

      {/* Event Stats */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">Triggers:</span>
          </div>
          <span className="text-white font-medium">{triggerCount}</span>
        </div>

        {affectedAgents > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">Affects:</span>
            </div>
            <span className="text-white font-medium">{affectedAgents} agents</span>
          </div>
        )}

        {lastTriggered && (
          <div className="text-gray-400">
            Last: {lastTriggered}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-green-400 border-2 border-gray-800"
      />

      {/* Event Type Indicator */}
      <div className="absolute -top-2 -right-2">
        <div className={`
          px-2 py-1 rounded-full text-xs font-bold text-white
          bg-gradient-to-r ${getEventColor(eventType)}
        `}>
          {eventType.slice(0, 3).toUpperCase()}
        </div>
      </div>
    </div>
  );
}