// AegntiX 3D Timeline Viewer - Revolutionary Temporal Visualization
// World's first immersive AI orchestration timeline experience

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Timeline3DScene } from './Timeline3DScene';
import { TemporalControls3D } from './TemporalControls3D';
import { Performance3DMonitor } from './Performance3DMonitor';
import { 
  TemporalControls, 
  Performance3DMetrics,
  QualitySettings 
} from '../../types/timeline3d';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize, 
  Settings, 
  Eye,
  Navigation,
  Zap
} from 'lucide-react';

interface Timeline3DViewerProps {
  scenarios: any[];
  events: any[];
  agents: any[];
  isPlaying: boolean;
  onPlayToggle: () => void;
}

export default function Timeline3DViewer({ 
  scenarios, 
  events, 
  agents, 
  isPlaying, 
  onPlayToggle 
}: Timeline3DViewerProps) {
  // Core 3D state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [performance, setPerformance] = useState<Performance3DMetrics>({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    memory: { used: 0, limit: 0 },
    gpuTime: 0
  });

  // Timeline controls
  const [temporalControls, setTemporalControls] = useState<TemporalControls>({
    playbackSpeed: 1.0,
    currentTimestamp: 0,
    activeBranch: 'main',
    viewMode: '3D',
    cameraState: {
      position: new THREE.Vector3(10, 10, 10),
      target: new THREE.Vector3(0, 0, 0),
      fov: 75
    }
  });

  // Quality settings for performance optimization
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    renderScale: 1.0,
    antialiasing: true,
    shadows: true,
    particleQuality: 'high',
    geometryDetail: 'high',
    effectsQuality: 'high',
    autoQuality: true
  });

  // View state
  const [showControls, setShowControls] = useState(true);
  const [showPerformance, setShowPerformance] = useState(false);

  // Initialize 3D scene
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Update performance metrics (would be populated by Three.js)
      setPerformance(prev => ({
        ...prev,
        fps: Math.round(60 + Math.random() * 5 - 2.5), // Simulated for now
        frameTime: 16.67 + Math.random() * 2 - 1,
        drawCalls: Math.floor(50 + Math.random() * 20),
        triangles: Math.floor(1000 + Math.random() * 500)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Camera control functions
  const resetCamera = () => {
    setTemporalControls(prev => ({
      ...prev,
      cameraState: {
        position: new THREE.Vector3(10, 10, 10),
        target: new THREE.Vector3(0, 0, 0),
        fov: 75
      }
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleTemporalControlChange = (newControls: Partial<TemporalControls>) => {
    setTemporalControls(prev => ({ ...prev, ...newControls }));
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 relative">
      {/* 3D Timeline Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Navigation className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              3D Timeline Visualization
            </h2>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Eye className="w-4 h-4" />
            <span>{events.length} events</span>
            <span>•</span>
            <span>{agents.length} agents</span>
            <span>•</span>
            <span className={`${performance.fps >= 55 ? 'text-green-400' : performance.fps >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
              {performance.fps} FPS
            </span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onPlayToggle}
            className={`flex items-center space-x-2 px-3 py-2 rounded transition-all ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset View</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
          >
            <Maximize className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowPerformance(!showPerformance)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          className="w-full h-full"
          gl={{ 
            antialias: qualitySettings.antialiasing,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true
          }}
          dpr={qualitySettings.renderScale}
          performance={{ min: 0.5 }}
          frameloop={isPlaying ? 'always' : 'demand'}
        >
          {/* Camera Setup */}
          <PerspectiveCamera
            makeDefault
            position={[10, 10, 10]}
            fov={75}
            near={0.1}
            far={1000}
          />

          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={100}
            minDistance={2}
            maxPolarAngle={Math.PI}
            minPolarAngle={0}
          />

          {/* Environment and Lighting */}
          <Environment preset="night" />
          
          {/* Ambient lighting for overall scene visibility */}
          <ambientLight intensity={0.3} color="#4F46E5" />
          
          {/* Main directional light */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            color="#ffffff"
            castShadow={qualitySettings.shadows}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          {/* Point lights for dramatic effect */}
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#EC4899" />
          <pointLight position={[-10, 0, 10]} intensity={0.3} color="#10B981" />

          {/* Main 3D Timeline Scene */}
          <Suspense fallback={null}>
            <Timeline3DScene
              events={events}
              agents={agents}
              scenarios={scenarios}
              temporalControls={temporalControls}
              qualitySettings={qualitySettings}
              isPlaying={isPlaying}
              onPerformanceUpdate={setPerformance}
            />
          </Suspense>

          {/* Performance Stats (for development) */}
          {showPerformance && <Stats showPanel={0} className="stats" />}
        </Canvas>

        {/* 2D UI Overlays */}
        {showControls && (
          <TemporalControls3D
            controls={temporalControls}
            onChange={handleTemporalControlChange}
            isPlaying={isPlaying}
            onPlayToggle={onPlayToggle}
          />
        )}

        {showPerformance && (
          <Performance3DMonitor
            metrics={performance}
            qualitySettings={qualitySettings}
            onQualityChange={setQualitySettings}
          />
        )}

        {/* Loading State */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-white text-lg font-semibold mb-2">Initializing 3D Timeline</h3>
              <p className="text-gray-400">Preparing immersive visualization...</p>
            </div>
          </div>
        )}

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
          <h4 className="font-semibold mb-2">Navigation:</h4>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• Mouse drag: Orbit around timeline</li>
            <li>• Scroll: Zoom in/out</li>
            <li>• Right drag: Pan view</li>
            <li>• Click events: Inspect details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}