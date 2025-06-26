// AegntiX 3D Timeline Type Definitions
// Advanced interfaces for immersive temporal visualization

import * as THREE from 'three';

// Core 3D Timeline Interfaces
export interface Timeline3DConfig {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  timelineLength: number;
  maxBranches: number;
  eventDensity: number;
  performanceTarget: number; // Target FPS
}

export interface TimelineEvent3D {
  id: string;
  mesh: THREE.Mesh;
  particle: THREE.Points;
  glow: THREE.Sprite;
  connections: THREE.Line[];
  position: THREE.Vector3;
  metadata: {
    agentId: string;
    impact: number; // 0-1 impact score
    eventType: 'action' | 'decision' | 'interaction' | 'milestone';
    timestamp: number;
    causality: string[]; // IDs of events this caused
  };
  animation: {
    pulseBrightness: number;
    rippleRadius: number;
    isActive: boolean;
  };
}

export interface TimelineBranch3D {
  id: string;
  parentBranch?: string;
  branchPoint: THREE.Vector3;
  direction: THREE.Vector3;
  events: TimelineEvent3D[];
  material: THREE.Material;
  isActive: boolean;
  confidenceLevel: number; // 0-1 for branch probability
}

export interface AgentPath3D {
  agentId: string;
  pathPoints: THREE.Vector3[];
  pathGeometry: THREE.BufferGeometry;
  pathMaterial: THREE.LineBasicMaterial;
  agentMarker: THREE.Mesh;
  personalityColor: THREE.Color;
  interactionNodes: THREE.Vector3[];
}

// Temporal Navigation System
export interface TemporalControls {
  playbackSpeed: number; // -10x to 10x
  currentTimestamp: number;
  activeBranch: string;
  viewMode: '3D' | 'VR' | 'AR' | 'God';
  cameraState: {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  };
}

export interface CameraTransition {
  from: THREE.Vector3;
  to: THREE.Vector3;
  duration: number;
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut';
  lookAt?: THREE.Vector3;
}

// Performance Monitoring
export interface Performance3DMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  memory: {
    used: number;
    limit: number;
  };
  gpuTime: number;
}

// Particle System Configuration
export interface ParticleSystemConfig {
  maxParticles: number;
  particleSize: number;
  emissionRate: number;
  lifespan: number;
  physics: {
    gravity: THREE.Vector3;
    friction: number;
    collision: boolean;
  };
  appearance: {
    color: THREE.Color;
    opacity: number;
    blending: THREE.Blending;
    texture?: THREE.Texture;
  };
}

// Interactive Elements
export interface InteractiveElement3D {
  id: string;
  mesh: THREE.Object3D;
  boundingBox: THREE.Box3;
  onHover: (event: THREE.Intersection) => void;
  onClick: (event: THREE.Intersection) => void;
  onFocus: (event: THREE.Intersection) => void;
  tooltip: {
    title: string;
    content: string;
    position: THREE.Vector3;
  };
}

// Scene Organization
export interface SceneGraph {
  timeline: THREE.Group;
  events: THREE.Group;
  agents: THREE.Group;
  particles: THREE.Group;
  ui: THREE.Group;
  effects: THREE.Group;
  lighting: {
    ambient: THREE.AmbientLight;
    directional: THREE.DirectionalLight;
    point: THREE.PointLight[];
  };
}

// Animation System
export interface AnimationClip3D {
  id: string;
  name: string;
  duration: number;
  tracks: THREE.KeyframeTrack[];
  loop: boolean;
  timeScale: number;
}

// Quality Settings
export interface QualitySettings {
  renderScale: number;
  antialiasing: boolean;
  shadows: boolean;
  particleQuality: 'low' | 'medium' | 'high' | 'ultra';
  geometryDetail: 'low' | 'medium' | 'high';
  effectsQuality: 'low' | 'medium' | 'high';
  autoQuality: boolean;
}

// Input/Navigation
export interface NavigationState {
  mode: 'orbit' | 'fly' | 'examine' | 'timeline';
  sensitivity: number;
  inertia: boolean;
  constraints: {
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
  };
}

// Timeline Data Transformation
export interface TimelineDataMapper {
  mapEventToPosition: (event: any, timeline: any) => THREE.Vector3;
  mapAgentToPath: (agent: any, events: any[]) => AgentPath3D;
  mapBranchToGeometry: (branch: any) => TimelineBranch3D;
  calculateCausality: (events: any[]) => { source: string; target: string }[];
}

// Main interfaces exported above