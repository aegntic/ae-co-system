// AegntiX 3D Timeline Type Definitions
// Advanced interfaces for immersive temporal visualization

import * as THREE from 'three';

// Core 3D Timeline Interfaces
export interface Timeline3DConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  timelineLength: number; // Duration in seconds or abstract units
  maxBranches: number;
  eventDensity: number; // Expected events per unit of time
  performanceTarget: number; // Target FPS, e.g., 60
}

export interface TimelineEvent3D {
  id: string; // Matches TimelineEvent.id from @shared/types
  mesh?: THREE.Mesh; // Visual representation in 3D space
  particle?: THREE.Points; // Particle effect for the event
  glow?: THREE.Sprite; // Glow effect for highlighting
  connections?: THREE.Line[]; // Lines connecting to related events (causality)
  position: THREE.Vector3; // Calculated 3D position on the timeline
  metadata: {
    agentId?: string; // From TimelineEvent.agentId
    impact: number; // 0-1 impact score, could be derived or stored
    eventType: string; // From TimelineEvent.eventType
    timestamp: number; // From TimelineEvent.timestamp
    data: any; // From TimelineEvent.data
    causality?: string[]; // IDs of events this caused or was caused by
  };
  animation?: { // Optional animation state for this event's visual
    pulseBrightness?: number;
    rippleRadius?: number;
    isActive?: boolean;
  };
}

export interface TimelineBranch3D {
  id: string; // Matches TimelineBranch.id from @shared/types
  parentBranchId?: string; // From TimelineBranch.parentBranchId
  branchPoint: THREE.Vector3; // 3D position where this branch starts
  direction: THREE.Vector3; // Vector indicating the branch's direction from parent
  events: string[]; // IDs of TimelineEvent3D objects on this branch
  material?: THREE.Material; // Material for rendering this branch's path
  isActive: boolean; // From TimelineBranch.isActive
  confidenceLevel?: number; // 0-1 for branch probability, if applicable
  name: string; // From TimelineBranch.name
}

export interface AgentPath3D {
  agentId: string;
  pathPoints: THREE.Vector3[]; // Points forming the agent's trajectory in 3D
  pathLine?: THREE.Line; // The THREE.Line object representing the path
  agentMarker?: THREE.Object3D; // 3D marker for the agent's current position
  personalityColor?: THREE.Color; // Color derived from agent's personality
  interactionNodes?: THREE.Vector3[]; // Points where this agent interacted
}

// Temporal Navigation System
export interface TemporalControlsState {
  playbackSpeed: number; // -10x to 10x, 1 is normal speed
  currentTimestamp: number; // Current point in time on the timeline
  activeBranchId: string; // ID of the currently viewed branch
  viewMode: '3D' | 'VR' | 'AR' | 'God'; // Visualization mode
  cameraState: {
    position: THREE.Vector3Tuple;
    target: THREE.Vector3Tuple;
    fov: number;
  };
  isInspectingEventId?: string; // ID of event currently being inspected
}

export interface CameraTransition {
  fromPosition: THREE.Vector3Tuple;
  toPosition: THREE.Vector3Tuple;
  fromTarget: THREE.Vector3Tuple;
  toTarget: THREE.Vector3Tuple;
  duration: number; // ms
  easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
}

// Performance Monitoring
export interface Performance3DMetrics {
  fps: number;
  frameTime: number; // ms
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  memory?: { // WebGLRenderer.info.memory if available
    geometries: number;
    textures: number;
  };
  gpuTime?: number; // If available through extensions
}

// Particle System Configuration
export interface ParticleSystemConfig {
  maxParticles: number;
  particleSize: number;
  emissionRate: number; // particles per second
  lifespan: number; // ms
  physics?: {
    gravity?: THREE.Vector3Tuple;
    friction?: number;
    collision?: boolean;
  };
  appearance: {
    color: THREE.ColorRepresentation;
    opacity: number;
    blending?: THREE.Blending;
    textureUrl?: string;
  };
}

// Interactive Elements
export interface InteractiveElement3D {
  id: string; // Can be event ID, agent ID, etc.
  object: THREE.Object3D; // The THREE.js object that is interactive
  boundingBox?: THREE.Box3; // For raycasting efficiency
  onHover?: (eventData: any, intersection: THREE.Intersection) => void;
  onClick?: (eventData: any, intersection: THREE.Intersection) => void;
  onFocus?: (eventData: any) => void; // When element is selected/inspected
  tooltip?: {
    title: string;
    content: string | (() => React.ReactNode); // Allow React component for tooltip
    positionOffset?: THREE.Vector3Tuple; // Relative to the object's center
  };
}

// Scene Organization
export interface SceneGraphNode {
  timeline?: THREE.Group;
  events?: THREE.Group;
  agents?: THREE.Group;
  particles?: THREE.Group;
  ui?: THREE.Group; // For 3D UI elements if any
  effects?: THREE.Group;
  lighting?: {
    ambient?: THREE.AmbientLight;
    directional?: THREE.DirectionalLight[]; // Allow multiple directional lights
    point?: THREE.PointLight[];
  };
}

// Animation System (simplified)
export interface AnimationConfig3D {
  target: THREE.Object3D; // Object to animate
  property: string; // e.g., 'position.x', 'material.opacity'
  fromValue: number;
  toValue: number;
  duration: number; // ms
  delay?: number; // ms
  easing?: (t: number) => number; // Easing function
  loop?: boolean | 'pingpong';
  onComplete?: () => void;
}


// Quality Settings
export type QualityLevel = 'low' | 'medium' | 'high' | 'ultra';
export interface QualitySettings {
  renderScale: number; // 0.5 to 2.0
  antialiasing: boolean; // MSAA, FXAA, etc.
  shadows: boolean | QualityLevel; // Simple on/off or quality level for shadows
  particleQuality: QualityLevel;
  geometryDetail: QualityLevel; // For LOD systems
  effectsQuality: QualityLevel; // Post-processing effects
  autoAdjustQuality: boolean; // Automatically adjust based on performance
}

// Input/Navigation Controls (for Three.js interaction)
export interface NavigationControllerState {
  mode: 'orbit' | 'fly' | 'examine' | 'timeline_scrub';
  sensitivity: {
    pan: number;
    zoom: number;
    rotate: number;
  };
  enableDamping: boolean; // For smoother controls
  dampingFactor: number;
  constraints?: {
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number; // Radians
    maxPolarAngle?: number; // Radians
    minAzimuthAngle?: number; // Radians
    maxAzimuthAngle?: number; // Radians
  };
}

// Helper for mapping shared types to 3D representations
export interface TimelineDataTransformer {
  // Example: map a shared TimelineEvent to its 3D position and visual style
  transformEventTo3D: (
    sharedEvent: any, // Replace 'any' with actual shared TimelineEvent type
    timelineConfig: Timeline3DConfig
  ) => Partial<TimelineEvent3D>;

  // Example: generate path points for an agent
  generateAgentPath: (
    agentId: string,
    events: any[], // Filtered events for this agent
    timelineConfig: Timeline3DConfig
  ) => THREE.Vector3[];
}

// This file primarily defines types for the 3D visualization aspects.
// It would interact with shared types from `@shared/types.ts` (e.g. Scenario, Agent, TimelineEvent from the backend).
// For example, a `Timeline3DViewer` component would take `Scenario` data and use these 3D types to render it.
