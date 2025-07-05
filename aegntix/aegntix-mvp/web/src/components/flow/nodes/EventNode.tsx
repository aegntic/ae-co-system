import { Handle, Position, NodeProps, Connection } from 'reactflow'; // Added Connection
import { Zap, Clock, Users, Settings2 } from 'lucide-react'; // Added Settings2
import React, { memo } from 'react'; // Added memo

interface EventNodeData {
  label: string;
  eventType?: 'trigger' | 'interrupt' | 'broadcast' | 'milestone' | string; // Allow custom event types
  triggerCount?: number;
  lastTriggered?: string; // Could be a timestamp or relative string like "2 min ago"
  affectedAgents?: number;
}

const EventNode: React.FC<NodeProps<EventNodeData>> = memo(({ data, selected, isConnectable }) => {
  const {
    label,
    eventType = 'trigger',
    triggerCount = 0,
    lastTriggered,
    affectedAgents = 0
  } = data;

  const getEventStyling = (type: string): { gradient: string, iconColor: string } => {
    switch (type) {
      case 'trigger': return { gradient: 'from-green-500 to-emerald-600', iconColor: 'text-green-300' };
      case 'interrupt': return { gradient: 'from-yellow-500 to-amber-500', iconColor: 'text-yellow-300' };
      case 'broadcast': return { gradient: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-300' };
      case 'milestone': return { gradient: 'from-purple-500 to-violet-600', iconColor: 'text-purple-300' };
      default: return { gradient: 'from-gray-500 to-slate-600', iconColor: 'text-gray-300' };
    }
  };

  const eventStyle = getEventStyling(eventType);

  return (
    <div className={`
      node-card event-node relative bg-[var(--color-bg-secondary)] border-2 rounded-xl p-3 sm:p-4 min-w-[200px] sm:min-w-[220px] transition-all shadow-md hover:shadow-lg
      ${selected ? `border-[var(--color-node-event)] shadow-[var(--color-node-event)]/30` : 'border-[var(--color-border-primary)]'}
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="react-flow__handle-custom handle-event"
        isConnectable={isConnectable}
      />

      {/* Event Header */}
      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
        <div className={`
          flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${eventStyle.gradient}
          flex items-center justify-center shadow-inner
        `}>
          <Zap className={`w-4 h-4 sm:w-5 sm:h-5 text-white/90`} />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-sm sm:text-base truncate" title={label}>{label}</h3>
          <p className="text-xs text-[var(--color-text-muted)] capitalize truncate" title={eventType}>{eventType} Event</p>
        </div>
      </div>

      {/* Event Stats */}
      <div className="space-y-1 sm:space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[var(--color-text-muted)] flex-shrink-0" />
            <span className="text-[var(--color-text-muted)]">Triggers:</span>
          </div>
          <span className="text-[var(--color-text-primary)] font-medium">{triggerCount}</span>
        </div>

        {affectedAgents > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-[var(--color-text-muted)] flex-shrink-0" />
              <span className="text-[var(--color-text-muted)]">Affects:</span>
            </div>
            <span className="text-[var(--color-text-primary)] font-medium">{affectedAgents} agents</span>
          </div>
        )}

        {lastTriggered && (
          <div className="text-[var(--color-text-muted)] text-right mt-1" title={`Last triggered: ${lastTriggered}`}>
            Last: <span className="text-[var(--color-text-secondary)]">{lastTriggered}</span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="react-flow__handle-custom handle-event"
        isConnectable={isConnectable}
      />

      {/* Event Type Indicator (Optional, if not clear from icon/color) */}
      <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2">
        <div className={`
          px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold text-white
          bg-gradient-to-r ${eventStyle.gradient} shadow-md
        `}>
          {eventType.length > 3 ? eventType.slice(0, 3).toUpperCase() : eventType.toUpperCase()}
        </div>
      </div>

      {/* Configuration Button (Example) */}
      <button
        title="Configure Event"
        className="absolute top-1 right-1 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors opacity-50 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          console.log(`Configure event: ${label}`);
        }}
      >
        <Settings2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
});

EventNode.displayName = 'EventNode';
export default EventNode;

// Add global styles for handles if not already in index.css
const handleStyle = `
  .react-flow__handle-custom.handle-event {
    background-color: var(--color-node-event); /* Default to event color or specific if needed */
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.getElementById('custom-node-styles') || document.createElement("style");
  styleSheet.id = 'custom-node-styles';
  styleSheet.type = "text/css";
  if (!document.getElementById('custom-node-styles')) {
    styleSheet.innerText += handleStyle;
    document.head.appendChild(styleSheet);
  } else if (!styleSheet.innerText.includes('.handle-event')) {
    styleSheet.innerText += handleStyle;
  }
}
