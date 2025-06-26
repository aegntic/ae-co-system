// AegntiX 3D Timeline Scene - Core 3D Visualization Engine
// Immersive temporal navigation with particle systems and agent paths

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { 
  TimelineEvent3D,
  AgentPath3D,
  TemporalControls,
  QualitySettings,
  Performance3DMetrics
} from '../../types/timeline3d';

interface Timeline3DSceneProps {
  events: any[];
  agents: any[];
  scenarios: any[];
  temporalControls: TemporalControls;
  qualitySettings: QualitySettings;
  isPlaying: boolean;
  onPerformanceUpdate: (metrics: Performance3DMetrics) => void;
}

export function Timeline3DScene({
  events,
  agents,
  temporalControls,
  qualitySettings,
  isPlaying,
  onPerformanceUpdate
}: Timeline3DSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  
  // Scene state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent3D[]>([]);
  const [agentPaths, setAgentPaths] = useState<AgentPath3D[]>([]);
  const [animationTime, setAnimationTime] = useState(0);

  // Performance tracking
  const [frameCount, setFrameCount] = useState(0);
  const [lastPerfUpdate, setLastPerfUpdate] = useState(Date.now());

  // Timeline configuration
  const TIMELINE_LENGTH = 50;
  const TIME_SCALE = 10;

  // Transform events to 3D positions
  useEffect(() => {
    const transformedEvents: TimelineEvent3D[] = events.map((event, index) => {
      // Calculate 3D position based on time and agent
      const timePosition = (event.timestamp || index) * TIME_SCALE / 1000;
      const agentIndex = agents.findIndex(a => a.id === event.agentId) || 0;
      const agentRadius = 5;
      const agentAngle = (agentIndex / agents.length) * Math.PI * 2;
      
      const position = new THREE.Vector3(
        Math.cos(agentAngle) * agentRadius,
        Math.sin(timePosition * 0.1) * 2, // Slight vertical wave
        timePosition
      );

      // Create visual elements
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: getEventColor(event.type || 'action'),
        emissive: getEventColor(event.type || 'action'),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);

      // Particle system for event
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = qualitySettings.particleQuality === 'high' ? 100 : 50;
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: getEventColor(event.type || 'action'),
        size: 0.05,
        transparent: true,
        opacity: 0.6
      });
      const particle = new THREE.Points(particleGeometry, particleMaterial);

      // Glow sprite
      const spriteMaterial = new THREE.SpriteMaterial({
        color: getEventColor(event.type || 'action'),
        transparent: true,
        opacity: 0.4
      });
      const glow = new THREE.Sprite(spriteMaterial);
      glow.position.copy(position);
      glow.scale.setScalar(1);

      return {
        id: event.id || `event_${index}`,
        mesh,
        particle,
        glow,
        connections: [],
        position,
        metadata: {
          agentId: event.agentId || 'unknown',
          impact: event.impact || Math.random(),
          eventType: event.type || 'action',
          timestamp: event.timestamp || Date.now(),
          causality: event.causality || []
        },
        animation: {
          pulseBrightness: 1,
          rippleRadius: 0,
          isActive: false
        }
      };
    });

    setTimelineEvents(transformedEvents);
  }, [events, agents, qualitySettings.particleQuality]);

  // Transform agents to 3D paths
  useEffect(() => {
    const transformedPaths: AgentPath3D[] = agents.map((agent, index) => {
      const agentEvents = events.filter(e => e.agentId === agent.id);
      const pathPoints: THREE.Vector3[] = [];
      const agentRadius = 5;
      const agentAngle = (index / agents.length) * Math.PI * 2;

      // Create path through time
      agentEvents.forEach((event, eventIndex) => {
        const timePosition = (event.timestamp || eventIndex * 1000) * TIME_SCALE / 1000;
        pathPoints.push(new THREE.Vector3(
          Math.cos(agentAngle) * agentRadius,
          Math.sin(timePosition * 0.1) * 2,
          timePosition
        ));
      });

      // Create path geometry
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const personalityColor = getPersonalityColor(agent.personality);
      const pathMaterial = new THREE.LineBasicMaterial({
        color: personalityColor,
        transparent: true,
        opacity: 0.7,
        linewidth: 2
      });

      // Agent marker
      const markerGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
      const markerMaterial = new THREE.MeshStandardMaterial({
        color: personalityColor,
        emissive: personalityColor,
        emissiveIntensity: 0.2
      });
      const agentMarker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      if (pathPoints.length > 0) {
        agentMarker.position.copy(pathPoints[0]);
      }

      return {
        agentId: agent.id,
        pathPoints,
        pathGeometry,
        pathMaterial,
        agentMarker,
        personalityColor: new THREE.Color(personalityColor),
        interactionNodes: pathPoints.filter((_, i) => i % 3 === 0) // Sample interaction points
      };
    });

    setAgentPaths(transformedPaths);
  }, [agents, events]);

  // Animation loop
  useFrame((_state, delta) => {
    if (!isPlaying) return;

    setAnimationTime(prev => prev + delta);
    setFrameCount(prev => prev + 1);

    // Update performance metrics
    const now = Date.now();
    if (now - lastPerfUpdate > 1000) {
      const fps = frameCount;
      setFrameCount(0);
      setLastPerfUpdate(now);
      
      onPerformanceUpdate({
        fps,
        frameTime: delta * 1000,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        memory: { used: 0, limit: 0 }, // Would need WebGL memory extension
        gpuTime: 0
      });
    }

    // Animate timeline events
    timelineEvents.forEach((event, index) => {
      const time = animationTime + index * 0.1;
      
      // Pulse animation
      event.animation.pulseBrightness = 0.5 + Math.sin(time * 3) * 0.5;
      
      if (event.mesh.material instanceof THREE.MeshStandardMaterial) {
        event.mesh.material.emissiveIntensity = event.animation.pulseBrightness * 0.5;
      }

      // Ripple effect for active events
      if (event.animation.isActive) {
        event.animation.rippleRadius += delta * 2;
        if (event.animation.rippleRadius > 2) {
          event.animation.rippleRadius = 0;
        }
      }

      // Update particle system
      if (event.particle.geometry.attributes.position) {
        const positions = event.particle.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(time + i) * 0.001; // Gentle floating
        }
        event.particle.geometry.attributes.position.needsUpdate = true;
      }
    });

    // Animate agent paths
    agentPaths.forEach((path) => {
      // Animate agent marker along path based on time
      const pathProgress = (temporalControls.currentTimestamp / 10000) % 1;
      const pathIndex = Math.floor(pathProgress * (path.pathPoints.length - 1));
      
      if (path.pathPoints.length > pathIndex) {
        path.agentMarker.position.copy(path.pathPoints[pathIndex]);
        path.agentMarker.rotation.y += delta;
      }
    });

    // Update scene group
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1 * temporalControls.playbackSpeed;
    }
  });

  // Helper functions
  const getEventColor = (eventType: string): number => {
    switch (eventType) {
      case 'action': return 0x6366f1; // Blue
      case 'decision': return 0xec4899; // Pink
      case 'interaction': return 0x10b981; // Green
      case 'milestone': return 0xf59e0b; // Yellow
      default: return 0x8b5cf6; // Purple
    }
  };

  const getPersonalityColor = (personality: any): number => {
    if (!personality?.traits) return 0x6366f1;
    
    const traits = personality.traits;
    const dominantTrait = Object.entries(traits).reduce((max: any, [key, value]: [string, any]) => 
      value > max.value ? { key, value } : max, 
      { key: '', value: 0 }
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

  return (
    <group ref={groupRef}>
      {/* Timeline Base Structure */}
      <mesh position={[0, 0, TIMELINE_LENGTH / 2]}>
        <cylinderGeometry args={[0.05, 0.05, TIMELINE_LENGTH, 8]} />
        <meshStandardMaterial color="#4F46E5" emissive="#4F46E5" emissiveIntensity={0.1} />
      </mesh>

      {/* Time Markers */}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[0, 0, i * TIMELINE_LENGTH / 10]}>
          <mesh>
            <ringGeometry args={[1, 1.2, 16]} />
            <meshBasicMaterial color="#6366f1" transparent opacity={0.3} />
          </mesh>
          <Text
            position={[2, 0, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            T+{i}s
          </Text>
        </group>
      ))}

      {/* Render Timeline Events */}
      {timelineEvents.map((event) => (
        <group key={event.id}>
          <primitive object={event.mesh} />
          <primitive object={event.particle} />
          <primitive object={event.glow} />
        </group>
      ))}

      {/* Render Agent Paths */}
      {agentPaths.map((path) => (
        <group key={path.agentId}>
          <line>
            <primitive object={path.pathGeometry} />
            <primitive object={path.pathMaterial} />
          </line>
          <primitive object={path.agentMarker} />
          
          {/* Agent label */}
          <Text
            position={[path.agentMarker.position.x, path.agentMarker.position.y + 1, path.agentMarker.position.z]}
            fontSize={0.3}
            color="#ffffff"
            anchorX="center"
            anchorY="bottom"
          >
            {path.agentId}
          </Text>
        </group>
      ))}

      {/* Timeline Grid */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -5, TIMELINE_LENGTH / 2]}>
        <planeGeometry args={[20, TIMELINE_LENGTH]} />
        <meshBasicMaterial 
          color="#1a1a2e" 
          transparent 
          opacity={0.1} 
          wireframe={true}
        />
      </mesh>

      {/* Ambient Particles */}
      {qualitySettings.effectsQuality !== 'low' && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={500}
              array={new Float32Array(Array.from({ length: 1500 }, () => (Math.random() - 0.5) * 30))}
              itemSize={3}
              args={[new Float32Array(Array.from({ length: 1500 }, () => (Math.random() - 0.5) * 30)), 3]}
            />
          </bufferGeometry>
          <pointsMaterial size={0.02} color="#6366f1" transparent opacity={0.3} />
        </points>
      )}
    </group>
  );
}