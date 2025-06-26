import { useState } from 'react';
import { Node } from 'reactflow';
import { X, User, GitBranch, Activity, Settings, Save } from 'lucide-react';

interface NodePanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (newData: any) => void;
}

export default function NodePanel({ node, onClose, onUpdate }: NodePanelProps) {
  const [nodeData, setNodeData] = useState(node.data);

  const handleSave = () => {
    onUpdate(nodeData);
    onClose();
  };

  const updatePersonalityTrait = (trait: string, value: number) => {
    setNodeData((prev: any) => ({
      ...prev,
      agentConfig: {
        ...prev.agentConfig,
        personality: {
          ...prev.agentConfig.personality,
          traits: {
            ...prev.agentConfig.personality.traits,
            [trait]: value
          }
        }
      }
    }));
  };

  const updateGoals = (goals: string[]) => {
    setNodeData((prev: any) => ({
      ...prev,
      agentConfig: {
        ...prev.agentConfig,
        goals
      }
    }));
  };

  const getNodeIcon = () => {
    switch (node.type) {
      case 'agent': return User;
      case 'decision': return GitBranch;
      case 'event': return Activity;
      case 'condition': return Settings;
      default: return Settings;
    }
  };

  const NodeIcon = getNodeIcon();

  const renderAgentEditor = () => {
    if (node.type !== 'agent' || !nodeData.agentConfig) return null;

    const { agentConfig } = nodeData;
    const traits = agentConfig.personality?.traits || {};

    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Agent Role
          </label>
          <input
            type="text"
            value={agentConfig.role || ''}
            onChange={(e) => setNodeData((prev: any) => ({
              ...prev,
              agentConfig: { ...prev.agentConfig, role: e.target.value },
              label: e.target.value
            }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
          />
        </div>

        {/* Personality Traits */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Personality Traits
          </label>
          <div className="space-y-3">
            {Object.entries(traits).map(([trait, value]) => (
              <div key={trait}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400 capitalize">{trait}</span>
                  <span className="text-sm text-white font-medium">{(value as number).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value as number}
                  onChange={(e) => updatePersonalityTrait(trait, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Goals
          </label>
          <div className="space-y-2">
            {agentConfig.goals?.map((goal: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...agentConfig.goals];
                    newGoals[index] = e.target.value;
                    updateGoals(newGoals);
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const newGoals = agentConfig.goals.filter((_: any, i: number) => i !== index);
                    updateGoals(newGoals);
                  }}
                  className="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => updateGoals([...agentConfig.goals, 'New Goal'])}
              className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md border border-dashed border-gray-600 transition-colors"
            >
              + Add Goal
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGenericEditor = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Label
          </label>
          <input
            type="text"
            value={nodeData.label || ''}
            onChange={(e) => setNodeData((prev: any) => ({ ...prev, label: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
          />
        </div>

        {nodeData.condition !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Condition
            </label>
            <textarea
              value={nodeData.condition || ''}
              onChange={(e) => setNodeData((prev: any) => ({ ...prev, condition: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-400 focus:outline-none h-20 font-mono text-sm"
              placeholder="Enter condition expression..."
            />
          </div>
        )}

        {nodeData.eventType !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={nodeData.eventType || 'trigger'}
              onChange={(e) => setNodeData((prev: any) => ({ ...prev, eventType: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="trigger">Trigger</option>
              <option value="interrupt">Interrupt</option>
              <option value="broadcast">Broadcast</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <NodeIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Edit {node.type} Node</h3>
              <p className="text-xs text-gray-400">ID: {node.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {node.type === 'agent' ? renderAgentEditor() : renderGenericEditor()}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex-1"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}