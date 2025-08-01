/**
 * Diagram Component for Remotion
 * 
 * Renders animated diagrams (flowcharts, architecture, etc.)
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface DiagramNode {
  id: string;
  label: string;
  type: 'default' | 'decision' | 'process' | 'data' | 'terminal';
  x?: number;
  y?: number;
}

interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface DiagramProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  diagramType: 'flowchart' | 'sequence' | 'architecture' | 'mindmap';
  style: any;
  animate?: boolean;
}

export const Diagram: React.FC<DiagramProps> = ({
  nodes,
  edges,
  diagramType,
  style,
  animate = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation progress
  const progress = animate
    ? spring({
        frame,
        fps,
        config: {
          damping: 100,
          stiffness: 100,
          mass: 0.8,
        },
      })
    : 1;

  // Auto-layout nodes if positions not provided
  const layoutNodes = () => {
    const layouted = [...nodes];
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const cellWidth = 80 / cols;
    const cellHeight = 80 / rows;

    layouted.forEach((node, index) => {
      if (!node.x || !node.y) {
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.x = 10 + col * cellWidth + cellWidth / 2;
        node.y = 10 + row * cellHeight + cellHeight / 2;
      }
    });

    return layouted;
  };

  const positionedNodes = layoutNodes();

  // Node shapes based on type
  const getNodeShape = (type: string) => {
    switch (type) {
      case 'decision':
        return 'rotate(45deg)';
      case 'process':
        return 'none';
      case 'data':
        return 'skewX(-20deg)';
      case 'terminal':
        return 'none';
      default:
        return 'none';
    }
  };

  // Node colors based on type
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'decision':
        return style.primaryColor || '#ff79c6';
      case 'process':
        return '#50fa7b';
      case 'data':
        return '#f1fa8c';
      case 'terminal':
        return '#8be9fd';
      default:
        return '#bd93f9';
    }
  };

  // Calculate edge paths
  const getEdgePath = (edge: DiagramEdge) => {
    const source = positionedNodes.find(n => n.id === edge.source);
    const target = positionedNodes.find(n => n.id === edge.target);

    if (!source || !target) return '';

    const x1 = (source.x || 0) * 0.01 * 1920;
    const y1 = (source.y || 0) * 0.01 * 1080;
    const x2 = (target.x || 0) * 0.01 * 1920;
    const y2 = (target.y || 0) * 0.01 * 1080;

    // Simple curved path
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - 50;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: style.backgroundColor || 'transparent',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        style={{ overflow: 'visible' }}
      >
        {/* Draw edges */}
        {edges.map((edge, index) => {
          const edgeProgress = interpolate(
            progress,
            [0, 1],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const pathLength = 500; // Approximate path length
          const dashOffset = pathLength * (1 - edgeProgress);

          return (
            <g key={edge.id}>
              <path
                d={getEdgePath(edge)}
                fill="none"
                stroke={style.secondaryColor || '#6272a4'}
                strokeWidth={3}
                strokeDasharray={animate ? pathLength : 0}
                strokeDashoffset={animate ? dashOffset : 0}
                markerEnd="url(#arrowhead)"
                opacity={interpolate(frame, [index * 5, index * 5 + 10], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })}
              />
              {edge.label && (
                <text
                  x={(positionedNodes.find(n => n.id === edge.source)?.x || 0) * 0.01 * 1920 +
                     (positionedNodes.find(n => n.id === edge.target)?.x || 0) * 0.01 * 1920) / 2}
                  y={(positionedNodes.find(n => n.id === edge.source)?.y || 0) * 0.01 * 1080 +
                     (positionedNodes.find(n => n.id === edge.target)?.y || 0) * 0.01 * 1080) / 2 - 10}
                  textAnchor="middle"
                  fill={style.color || '#f8f8f2'}
                  fontSize={14}
                  fontFamily={style.fontFamily || 'Inter, system-ui, sans-serif'}
                  opacity={interpolate(frame, [index * 5 + 10, index * 5 + 20], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={style.secondaryColor || '#6272a4'}
            />
          </marker>
        </defs>

        {/* Draw nodes */}
        {positionedNodes.map((node, index) => {
          const nodeProgress = interpolate(
            frame,
            [index * 3, index * 3 + 10],
            [0, 1],
            {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );

          const scale = animate
            ? spring({
                frame: frame - index * 3,
                fps,
                config: {
                  damping: 10,
                  stiffness: 300,
                  mass: 0.5,
                },
              })
            : 1;

          const x = (node.x || 0) * 0.01 * 1920;
          const y = (node.y || 0) * 0.01 * 1080;

          return (
            <g
              key={node.id}
              transform={`translate(${x}, ${y})`}
              opacity={nodeProgress}
            >
              {/* Node shape */}
              <rect
                x={-60}
                y={-30}
                width={120}
                height={60}
                rx={node.type === 'terminal' ? 30 : 8}
                fill={getNodeColor(node.type)}
                stroke={style.primaryColor || '#ff79c6'}
                strokeWidth={2}
                transform={`scale(${scale}) ${getNodeShape(node.type)}`}
                filter="url(#shadow)"
              />

              {/* Node label */}
              <text
                x={0}
                y={5}
                textAnchor="middle"
                fill={style.backgroundColor || '#282a36'}
                fontSize={16}
                fontWeight={600}
                fontFamily={style.fontFamily || 'Inter, system-ui, sans-serif'}
                transform={node.type === 'decision' ? 'rotate(-45)' : 'none'}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Shadow filter */}
        <defs>
          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodOpacity="0.2"
            />
          </filter>
        </defs>
      </svg>

      {/* Diagram title */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 24,
          fontWeight: 700,
          color: style.color || '#f8f8f2',
          fontFamily: style.fontFamily || 'Inter, system-ui, sans-serif',
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram
      </div>
    </div>
  );
};