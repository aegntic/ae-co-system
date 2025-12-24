// AegntiX 3D Timeline Scene - Core 3D Visualization Engine
// Immersive temporal navigation with particle systems and agent paths

import React, { useRef, useEffect, useState, useMemo } from 'react'; // Added React, useMemo
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  TimelineEvent3D,
  AgentPath3D,
  TemporalControlsState, // Changed from TemporalControls
  QualitySettings,
  Performance3DMetrics
} from '../../types/timeline3d'; // Ensure path is correct

interface Timeline3DSceneProps {
  events: any[]; // Should be typed based on actual shared event structure
  agents: any[]; // Should be typed based on actual shared agent structure
  // scenarios: any[]; // This prop was in original but not used, consider removing or using
  temporalControls: TemporalControlsState;
  qualitySettings: QualitySettings;
  isPlaying: boolean;
  onPerformanceUpdate: (metrics: Performance3DMetrics) => void;
}

// Constants for scene layout
const TIMELINE_LENGTH_UNITS = 50; // Length of the Z-axis for the timeline
const AGENT_ORBIT_RADIUS = 5;    // Radius for arranging agent paths around Z-axis
const EVENT_TIME_SCALE = TIMELINE_LENGTH_UNITS / 60000; // Scale 60s of events to TIMELINE_LENGTH_UNITS

export function Timeline3DScene({
  events,
  agents,
  temporalControls,
  qualitySettings,
  isPlaying,
  onPerformanceUpdate
}: Timeline3DSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl, scene } = useThree(); // scene from useThree can be used for direct manipulation if needed

  const [animationTime, setAnimationTime] = useState(0);

  // Performance tracking state
  const frameCountRef = useRef(0);
  const lastPerfUpdateRef = useRef(Date.now());


  // Memoize transformed events and paths to avoid re-computation on every render
  const timelineEvents3D = useMemo(() => {
    return events.map((event, index): TimelineEvent3D => {
      const timePositionZ = (event.timestamp || index * 1000) * EVENT_TIME_SCALE;
      const agentIndex = agents.findIndex(a => a.id === event.agentId);
      const validAgentIndex = agentIndex >=0 ? agentIndex : (index % Math.max(1, agents.length)); // Fallback for events with no agent or if agent not found

      const agentAngle = (validAgentIndex / Math.max(1, agents.length)) * Math.PI * 2;

      const position = new THREE.Vector3(
        Math.cos(agentAngle) * AGENT_ORBIT_RADIUS,
        Math.sin(timePositionZ * 0.2 + agentAngle) * 1.5, // Vary Y for visual separation
        timePositionZ - TIMELINE_LENGTH_UNITS / 2 // Center timeline along Z
      );

      return {
        id: event.id || `event_${index}`,
        position,
        metadata: {
          agentId: event.agentId || 'unknown',
          impact: event.impact || Math.random(),
          eventType: event.type || 'action',
          timestamp: event.timestamp || index * 1000,
          data: event.data || {},
          causality: event.causality || []
        },
      };
    });
  }, [events, agents]);

  const agentPaths3D = useMemo(() => {
    return agents.map((agent, index): AgentPath3D => {
      const agentEvents = events.filter(e => e.agentId === agent.id).sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
      const pathPoints: THREE.Vector3[] = [];
      const agentAngle = (index / Math.max(1, agents.length)) * Math.PI * 2;

      agentEvents.forEach((event, eventIdx) => {
        const timePositionZ = (event.timestamp || eventIdx * 1000) * EVENT_TIME_SCALE;
        pathPoints.push(new THREE.Vector3(
          Math.cos(agentAngle) * AGENT_ORBIT_RADIUS,
          Math.sin(timePositionZ * 0.2 + agentAngle) * 1.5,
          timePositionZ - TIMELINE_LENGTH_UNITS / 2
        ));
      });
      if (pathPoints.length === 0) { // Add a default point if no events for agent
          pathPoints.push(new THREE.Vector3(Math.cos(agentAngle) * AGENT_ORBIT_RADIUS, 0, -TIMELINE_LENGTH_UNITS/2));
      }


      const personalityColor = getPersonalityColor(agent.personality);

      return {
        agentId: agent.id,
        pathPoints,
        personalityColor: new THREE.Color(personalityColor),
        // pathGeometry, pathMaterial, agentMarker will be created in JSX
      };
    });
  }, [agents, events]);


  useFrame((_state, delta) => {
    if (isPlaying) {
      setAnimationTime(prev => prev + delta * temporalControls.playbackSpeed);
    }
    frameCountRef.current++;

    const now = Date.now();
    if (now - lastPerfUpdateRef.current > 1000) { // Update performance metrics every second
      const fps = frameCountRef.current;
      frameCountRef.current = 0;
      lastPerfUpdateRef.current = now;

      onPerformanceUpdate({
        fps,
        frameTime: delta * 1000, // This is last frame time, not avg. Might need rolling avg.
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      });
    }

    // Example: animate event meshes or agent markers based on animationTime or temporalControls.currentTimestamp
    // This part needs to be carefully designed based on how you want visualization to react to time
  });

  // Helper functions
  const getEventColor = (eventType: string): THREE.ColorRepresentation => {
    switch (eventType) {
      case 'action': return qualitySettings.effectsQuality === 'low' ? 0x5555ff : 0x6366f1;
      case 'decision': return qualitySettings.effectsQuality === 'low' ? 0xff55aa : 0xec4899;
      case 'interaction': return qualitySettings.effectsQuality === 'low' ? 0x55ff55 :0x10b981;
      case 'milestone': return qualitySettings.effectsQuality === 'low' ? 0xffaa55 :0xf59e0b;
      default: return qualitySettings.effectsQuality === 'low' ? 0xaaaaaa : 0x8b5cf6;
    }
  };

  const getPersonalityColor = (personality: any): THREE.ColorRepresentation => {
    if (!personality?.traits) return 0x6366f1; // Default blue
    const traits = personality.traits;
    const dominantTrait = Object.entries(traits).reduce((max: any, entry: [string, any]) =>
      entry[1] > max.value ? { key: entry[0], value: entry[1] } : max,
      { key: '', value: -1 }
    );
    switch (dominantTrait.key) {
      case 'openness': return 0x8b5cf6; // Purple
      case 'conscientiousness': return 0x10b981; // Green
      case 'extraversion': return 0xf59e0b; // Orange
      case 'agreeableness': return 0x06b6d4; // Cyan
      case 'neuroticism': return 0xef4444; // Red
      default: return 0x6366f1; // Blue
    }
  };

  const particleCount = qualitySettings.particleQuality === 'high' ? 80 : qualitySettings.particleQuality === 'medium' ? 40 : 20;
  const eventSphereSize = qualitySettings.geometryDetail === 'high' ? 0.2 : qualitySettings.geometryDetail === 'medium' ? 0.15 : 0.1;


  return (
    <group ref={groupRef}>
      {/* Timeline Axis */}
      <mesh position={[0, 0, 0]}> {/* Centered at origin, events are +/- TIMELINE_LENGTH_UNITS/2 */}
        <cylinderGeometry args={[0.03, 0.03, TIMELINE_LENGTH_UNITS, 8]} />
        <meshStandardMaterial color="#4F46E5" emissive="#333" flatShading={qualitySettings.geometryDetail === 'low'} />
      </mesh>

      {/* Time Markers */}
      {Array.from({ length: 11 }, (_, i) => {
          const zPos = (i / 10) * TIMELINE_LENGTH_UNITS - TIMELINE_LENGTH_UNITS / 2;
          return (
            <group key={`marker-${i}`} position={[0, 0, zPos]}>
              <Text
                position={[AGENT_ORBIT_RADIUS + 0.5, 0, 0]}
                fontSize={0.3}
                color="white"
                anchorX="left"
                anchorY="middle"
                rotation={[0, Math.PI / 2, 0]} // Rotate text to be readable
              >
                {`${Math.round(i * (maxTimestamp / 10000))}s`}
              </Text>
               <mesh rotation={[Math.PI/2,0,0]}>
                 <ringGeometry args={[AGENT_ORBIT_RADIUS - 0.1, AGENT_ORBIT_RADIUS + 0.1, 32]} />
                 <meshBasicMaterial color="rgba(100,100,200,0.2)" transparent opacity={0.2} side={THREE.DoubleSide}/>
               </mesh>
            </group>
          );
      })}

      {/* Render Timeline Events */}
      {timelineEvents3D.map((event) => (
        <group key={event.id} position={event.position}>
          <mesh castShadow={qualitySettings.shadows as boolean}>
            <sphereGeometry args={[eventSphereSize, qualitySettings.geometryDetail === 'high' ? 16 : 8, qualitySettings.geometryDetail === 'high' ? 16 : 8]} />
            <meshStandardMaterial
                color={getEventColor(event.metadata.eventType)}
                emissive={getEventColor(event.metadata.eventType)}
                emissiveIntensity={0.4}
                transparent opacity={0.85}
                roughness={0.3} metalness={0.1}
            />
          </mesh>
          {qualitySettings.effectsQuality !== 'low' && event.metadata.impact > 0.7 && (
            <pointLight color={getEventColor(event.metadata.eventType)} intensity={event.metadata.impact * 0.5} distance={3} decay={2} />
          )}
        </group>
      ))}

      {/* Render Agent Paths */}
      {agentPaths3D.map((path) => (
        path.pathPoints.length > 1 && (
          <line key={path.agentId}>
            <bufferGeometry attach="geometry">
                 <bufferAttribute
                    attach='attributes-position'
                    count={path.pathPoints.length}
                    array={new Float32Array(path.pathPoints.flatMap(p => [p.x, p.y, p.z]))}
                    itemSize={3}
                 />
            </bufferGeometry>
            <lineBasicMaterial
                attach="material"
                color={path.personalityColor}
                linewidth={qualitySettings.geometryDetail === 'high' ? 2 : 1}
                transparent opacity={0.6}
            />
          </line>
        )
      ))}

      {/* Current Time Indicator (simple line for now) */}
      {isPlaying && (
        <mesh position={[0,0, (temporalControls.currentTimestamp * EVENT_TIME_SCALE) - TIMELINE_LENGTH_UNITS / 2]}>
            <planeGeometry args={[AGENT_ORBIT_RADIUS * 2.2, 0.05]} />
            <meshBasicMaterial color="white" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Optional: Ground Plane */}
      {qualitySettings.geometryDetail !== 'low' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -AGENT_ORBIT_RADIUS -1, 0]}>
            <planeGeometry args={[AGENT_ORBIT_RADIUS * 3, TIMELINE_LENGTH_UNITS * 1.2]} />
            <meshStandardMaterial color="#111827" roughness={0.8} metalness={0.2} />
        </mesh>
      )}
    </group>
  );
}

Timeline3DScene.displayName = "Timeline3DScene";
