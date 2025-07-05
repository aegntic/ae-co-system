import {
  Play,
  Pause,
  Square, // Stop icon
  Save,
  Download,
  Upload,
  Users,    // For Agent Node
  GitFork,  // Changed from GitBranch for Decision Node
  Zap,      // Changed from Activity for Event Node
  ShieldCheck, // Changed from Settings for Condition Node
  PlusCircle // Generic Add icon
} from 'lucide-react';

interface ScenarioControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onAddNode: (type: string) => void;
  nodeCount: number;
  edgeCount: number;
  // Add new props for save, load, export, import if they have functionality
  // onSave?: () => void;
  // onLoad?: () => void;
  // onExport?: () => void;
  // onImport?: () => void;
}

export default function ScenarioControls({
  isPlaying,
  onTogglePlayback,
  onAddNode,
  nodeCount,
  edgeCount
}: ScenarioControlsProps) {

  const nodeTypes = [
    { type: 'agent', label: 'Agent', icon: Users, color: 'bg-indigo-600 hover:bg-indigo-700', description: "Represents an AI or human participant." },
    { type: 'decision', label: 'Decision', icon: GitFork, color: 'bg-pink-600 hover:bg-pink-700', description: "A point where the flow branches based on a condition." },
    { type: 'event', label: 'Event', icon: Zap, color: 'bg-emerald-600 hover:bg-emerald-700', description: "An occurrence that can trigger actions or state changes." },
    { type: 'condition', label: 'Condition', icon: ShieldCheck, color: 'bg-amber-600 hover:bg-amber-700', description: "Evaluates a state or expression to true/false." },
  ];

  // Placeholder actions for save/load/export/import
  const handleSave = () => console.log("Save scenario action triggered");
  const handleExport = () => console.log("Export scenario action triggered");
  const handleImport = () => console.log("Import scenario action triggered");


  return (
    // Controls container positioned at top-left by React Flow's Panel
    <div className="flex flex-col space-y-3 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl glass-effect max-w-xs">

      {/* Playback Controls */}
      <div className="p-3 bg-black/20 rounded-md">
        <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Playback</div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlayback}
            title={isPlaying ? "Pause Scenario" : "Play Scenario"}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all text-sm font-medium
              ${isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
              }
            `}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            title="Stop Scenario (Not Implemented)"
            disabled // Example: disable if not implemented
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-md transition-all text-sm font-medium"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Add Nodes Section */}
      <div className="p-3 bg-black/20 rounded-md">
        <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Add Node</div>
        <div className="grid grid-cols-2 gap-2">
          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <button
                key={nodeType.type}
                onClick={() => onAddNode(nodeType.type)}
                title={nodeType.description}
                className={`
                  flex items-center space-x-1.5 px-2 py-1.5 rounded-md transition-all text-white text-xs font-medium
                  ${nodeType.color}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{nodeType.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Actions Section */}
      <div className="p-3 bg-black/20 rounded-md">
        <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Scenario Actions</div>
        <div className="space-y-2">
          <button
            onClick={handleSave}
            title="Save current scenario (Not Implemented)"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all w-full text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              title="Export scenario to JSON (Not Implemented)"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-md transition-all flex-1 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={handleImport}
              title="Import scenario from JSON (Not Implemented)"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border-primary)] text-[var(--color-text-secondary)] rounded-md transition-all flex-1 text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="p-3 bg-black/20 rounded-md">
        <div className="text-xs text-[var(--color-text-muted)] mb-2 font-medium">Statistics</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Nodes:</span>
            <span className="text-[var(--color-text-primary)] font-medium">{nodeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Connections:</span>
            <span className="text-[var(--color-text-primary)] font-medium">{edgeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Status:</span>
            <span className={`font-medium ${isPlaying ? 'text-green-400' : 'text-[var(--color-text-muted)]'}`}>
              {isPlaying ? 'Running' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
