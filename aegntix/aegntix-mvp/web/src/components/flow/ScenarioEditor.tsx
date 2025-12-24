import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  NodeTypes, // Added NodeTypes
  DefaultEdgeOptions, // Added DefaultEdgeOptions
  FitViewOptions, // Added FitViewOptions
  Panel, // For custom controls if needed
} from 'reactflow';
import 'reactflow/dist/style.css';

import AgentNode from './nodes/AgentNode';
import DecisionNode from './nodes/DecisionNode';
import EventNode from './nodes/EventNode';
import ConditionNode from './nodes/ConditionNode';
import NodePanel from './panels/NodePanel';
import ScenarioControls from './controls/ScenarioControls';

// Custom node types
const nodeTypes: NodeTypes = { // Explicitly use NodeTypes
  agent: AgentNode,
  decision: DecisionNode,
  event: EventNode,
  condition: ConditionNode,
};

// Initial scenario setup
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'agent',
    position: { x: 250, y: 100 },
    data: {
      agentConfig: {
        id: 'agent-1',
        role: 'Project Manager',
        personality: {
          traits: {
            openness: 0.8,
            conscientiousness: 0.9,
            extraversion: 0.7,
            agreeableness: 0.6,
            neuroticism: 0.3
          }
        },
        goals: ['Coordinate team', 'Meet deadlines', 'Ensure quality']
      },
      label: 'Project Manager', // Label for display
      isActive: false,
      performance: 75,
    },
  },
  {
    id: '2',
    type: 'agent',
    position: { x: 100, y: 300 },
    data: {
      agentConfig: {
        id: 'agent-2',
        role: 'Developer',
        personality: {
          traits: {
            openness: 0.9,
            conscientiousness: 0.8,
            extraversion: 0.4,
            agreeableness: 0.7,
            neuroticism: 0.4
          }
        },
        goals: ['Write clean code', 'Solve problems', 'Learn new tech']
      },
      label: 'Developer',
      isActive: true,
      performance: 90,
    },
  },
  {
    id: '3',
    type: 'decision',
    position: { x: 400, y: 200 },
    data: {
      label: 'Feature Complete?',
      condition: 'code_quality > 0.8 && tests_pass',
      lastResult: true,
      evaluationCount: 15,
    },
  },
  {
    id: '4',
    type: 'event',
    position: { x: 600, y: 300 },
    data: {
      label: 'Sprint Review',
      eventType: 'milestone',
      triggerCount: 3,
      lastTriggered: '2 days ago',
      affectedAgents: 5,
    },
  },
  {
    id: '5',
    type: 'condition',
    position: { x: 250, y: 450 },
    data: {
      label: 'Budget Check',
      condition: 'remaining_budget > 10000',
      isValid: true,
      checkCount: 42,
      successRate: 85,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'smoothstep', // Using a different edge type
    animated: true,
    label: 'Status Update',
    data: { // Custom data for edges
      weight: 0.8,
      condition: 'project_update'
    }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    animated: true,
    label: 'Code Submitted',
    data: {
      weight: 0.9,
      condition: 'code_complete'
    }
  },
  {
    id: 'e3-4', // From decision true to event
    source: '3',
    target: '4',
    sourceHandle: 'true', // Specify the 'true' handle of DecisionNode
    type: 'smoothstep',
    label: 'If True',
  },
   {
    id: 'e3-5', // From decision false to condition
    source: '3',
    target: '5',
    sourceHandle: 'false', // Specify the 'false' handle of DecisionNode
    type: 'smoothstep',
    label: 'If False',
  }
];

const defaultEdgeOptions: DefaultEdgeOptions = {
  animated: true,
  type: 'smoothstep', // Default edge type
  style: { strokeWidth: 2 },
};

const fitViewOptions: FitViewOptions = {
  padding: 0.1,
};

export default function ScenarioEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // const [rfInstance, setRfInstance] = useState(null); // For programmatically using ReactFlow instance

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNewNode = useCallback((type: string) => {
    const newNodeId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 }, // Adjusted random position
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        // Default data based on node type
        ...(type === 'agent' && {
          agentConfig: {
            id: `agent_${Date.now()}`,
            role: 'New Agent',
            personality: { traits: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 }},
            goals: ['Define goals']
          },
          isActive: false, performance: 50,
        }),
        ...(type === 'decision' && { condition: 'new_condition', lastResult: undefined, evaluationCount: 0 }),
        ...(type === 'event' && { eventType: 'trigger', triggerCount: 0, affectedAgents: 0 }),
        ...(type === 'condition' && { condition: 'is_true', isValid: true, checkCount: 0, successRate: 100 }),
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
    // If the selected node is updated, refresh its state in the panel
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => prev ? ({ ...prev, data: { ...prev.data, ...newData } }) : null);
    }
  }, [setNodes, selectedNode]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // TODO: Connect to backend to start/stop scenario execution
    console.log(isPlaying ? "Stopping scenario" : "Starting scenario");
  };

  return (
    <div className="h-full flex bg-gray-900"> {/* Ensure parent has height */}
      {/* Main Flow Editor */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={fitViewOptions}
          // onLoad={setRfInstance} // If you need the instance
          className="bg-gray-900" // Ensure ReactFlow also has dark bg
        >
          <Controls className="react-flow__controls_custom" />
          <MiniMap
            className="react-flow__minimap_custom"
            nodeColor={(node: Node) => { // Explicitly type node
              switch (node.type) {
                case 'agent': return 'var(--color-node-agent)';
                case 'decision': return 'var(--color-node-decision)';
                case 'event': return 'var(--color-node-event)';
                case 'condition': return 'var(--color-node-condition)';
                default: return '#71717a'; // var(--color-text-muted)
              }
            }}
            nodeStrokeWidth={3}
            pannable
            zoomable
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24} // Increased gap
            size={1.5} // Slightly larger dots
            color="var(--color-bg-tertiary)" // Use CSS variable
          />
           {/* Custom Panel for Scenario Controls */}
          <Panel position="top-left">
            <ScenarioControls
              isPlaying={isPlaying}
              onTogglePlayback={togglePlayback}
              onAddNode={addNewNode}
              nodeCount={nodes.length}
              edgeCount={edges.length}
            />
          </Panel>
        </ReactFlow>
      </div>

      {/* Right Panel for Node Editing */}
      {selectedNode && (
        <NodePanel
          key={selectedNode.id} // Add key to force re-mount on node change if panel has internal state issues
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(newData) => updateNodeData(selectedNode.id, newData)}
        />
      )}
    </div>
  );
}

// Basic styling for custom controls (can be moved to CSS file)
const style = document.createElement('style');
style.innerHTML = `
  .react-flow__controls_custom button {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    color: var(--color-text-secondary);
  }
  .react-flow__controls_custom button:hover {
    background-color: var(--color-bg-tertiary);
  }
  .react-flow__minimap_custom {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
  }
`;
document.head.appendChild(style);
