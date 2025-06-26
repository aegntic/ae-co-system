import { 
  Play, 
  Pause, 
  Square, 
  Save, 
  Download, 
  Upload,
  Users,
  GitBranch,
  Activity,
  Settings
} from 'lucide-react';

interface ScenarioControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onAddNode: (type: string) => void;
  nodeCount: number;
  edgeCount: number;
}

export default function ScenarioControls({ 
  isPlaying, 
  onTogglePlayback, 
  onAddNode, 
  nodeCount, 
  edgeCount 
}: ScenarioControlsProps) {
  const nodeTypes = [
    { type: 'agent', label: 'Agent', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'decision', label: 'Decision', icon: GitBranch, color: 'bg-pink-600 hover:bg-pink-700' },
    { type: 'event', label: 'Event', icon: Activity, color: 'bg-green-600 hover:bg-green-700' },
    { type: 'condition', label: 'Condition', icon: Settings, color: 'bg-yellow-600 hover:bg-yellow-700' },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 space-y-4">
      {/* Playback Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 glass-effect">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlayback}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded transition-all
              ${isPlaying 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Play</span>
              </>
            )}
          </button>
          
          <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all">
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Add Nodes */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 glass-effect">
        <div className="text-sm text-gray-400 mb-2 font-medium">Add Node:</div>
        <div className="grid grid-cols-2 gap-2">
          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <button
                key={nodeType.type}
                onClick={() => onAddNode(nodeType.type)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded transition-all text-white text-sm
                  ${nodeType.color}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{nodeType.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Actions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 glass-effect">
        <div className="text-sm text-gray-400 mb-2 font-medium">Scenario:</div>
        <div className="space-y-2">
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all w-full text-sm">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all flex-1 text-sm">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all flex-1 text-sm">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 glass-effect">
        <div className="text-sm text-gray-400 mb-2 font-medium">Statistics:</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Nodes:</span>
            <span className="text-white font-medium">{nodeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Connections:</span>
            <span className="text-white font-medium">{edgeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-medium ${isPlaying ? 'text-green-400' : 'text-gray-400'}`}>
              {isPlaying ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}