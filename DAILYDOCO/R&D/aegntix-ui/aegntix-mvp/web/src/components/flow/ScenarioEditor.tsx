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
} from 'reactflow';
import 'reactflow/dist/style.css';

import AgentNode from './nodes/AgentNode';
import DecisionNode from './nodes/DecisionNode';
import EventNode from './nodes/EventNode';
import ConditionNode from './nodes/ConditionNode';
import NodePanel from './panels/NodePanel';
import ScenarioControls from './controls/ScenarioControls';

// Custom node types
const nodeTypes = {
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
      label: 'Project Manager'
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
      label: 'Developer'
    },
  },
  {
    id: '3',
    type: 'decision',
    position: { x: 400, y: 200 },
    data: {
      label: 'Feature Complete?',
      condition: 'code_quality > 0.8 && tests_pass',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'default',
    animated: true,
    data: {
      weight: 0.8,
      condition: 'project_update'
    }
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'default',
    animated: true,
    data: {
      weight: 0.9,
      condition: 'code_complete'
    }
  },
];

export default function ScenarioEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const addNewNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 200 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        ...(type === 'agent' && {
          agentConfig: {
            id: `agent_${Date.now()}`,
            role: 'New Agent',
            personality: {
              traits: {
                openness: 0.5,
                conscientiousness: 0.5,
                extraversion: 0.5,
                agreeableness: 0.5,
                neuroticism: 0.5
              }
            },
            goals: ['Define goals']
          }
        })
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
  }, [setNodes]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Here we would connect to the backend to start/stop scenario execution
  };

  return (
    <div className="h-full flex">
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
          className="bg-gray-900"
          fitView
        >
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap 
            className="bg-gray-800 border border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'agent': return '#6366f1';
                case 'decision': return '#ec4899';
                case 'event': return '#10b981';
                case 'condition': return '#f59e0b';
                default: return '#71717a';
              }
            }}
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1} 
            color="#374151"
          />
        </ReactFlow>

        {/* Scenario Controls */}
        <ScenarioControls 
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onAddNode={addNewNode}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      </div>

      {/* Right Panel */}
      {selectedNode && (
        <NodePanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(newData) => updateNodeData(selectedNode.id, newData)}
        />
      )}
    </div>
  );
}