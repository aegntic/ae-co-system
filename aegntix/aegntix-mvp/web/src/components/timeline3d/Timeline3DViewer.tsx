// AegntiX 3D Timeline Viewer - Revolutionary Temporal Visualization
// World's first immersive AI orchestration timeline experience

import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react'; // Added React, useMemo
import { Canvas, ThreeEvent } from '@react-three/fiber'; // Added ThreeEvent
import { OrbitControls, PerspectiveCamera, Environment, Stats, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Timeline3DScene } from './Timeline3DScene';
import { TemporalControls3D } from './TemporalControls3D';
import { Performance3DMonitor } from './Performance3DMonitor';
import {
  TemporalControlsState,
  Performance3DMetrics,
  QualitySettings,
  TimelineEvent3D // For tooltip data
} from '../../types/timeline3d';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize, // For fullscreen toggle
  Settings2 as Settings, // Consistent icon
  Eye,
  Navigation, // Can be used for camera modes
  Zap,
  Info // For tooltips
} from 'lucide-react';

interface Timeline3DViewerProps {
  scenarios: any[]; // Should be typed Scenario[] from shared types
  events: any[];    // Should be typed TimelineEvent[] from shared types
  agents: any[];    // Should be typed Agent[] from shared types
  isPlaying: boolean;
  onPlayToggle: () => void;
}

// Default initial camera state
const initialCameraState = {
  position: new THREE.Vector3(0, 5, 15) as unknown as THREE.Vector3Tuple, // Centered view, slightly elevated
  target: new THREE.Vector3(0, 0, 0) as unknown as THREE.Vector3Tuple,   // Looking at the origin of the timeline
  fov: 60
};

export default function Timeline3DViewer({
  scenarios,
  events,
  agents,
  isPlaying,
  onPlayToggle
}: Timeline3DViewerProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null); // Ref for the container for fullscreen
  const [isInitialized, setIsInitialized] = useState(false); // Could be used for loading screen

  const [performance, setPerformance] = useState<Performance3DMetrics>({
    fps: 60, frameTime: 16.67, drawCalls: 0, triangles: 0, geometries: 0, textures: 0,
  });

  const [temporalControls, setTemporalControls] = useState<TemporalControlsState>({
    playbackSpeed: 1.0, currentTimestamp: 0, activeBranchId: 'main', viewMode: '3D',
    cameraState: initialCameraState
  });

  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    renderScale: 1.0, antialiasing: true, shadows: true, particleQuality: 'medium', // Default to medium
    geometryDetail: 'medium', effectsQuality: 'medium', autoAdjustQuality: true
  });

  const [showControlsUI, setShowControlsUI] = useState(true);
  const [showPerformanceUI, setShowPerformanceUI] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string, x: number, y: number } | null>(null);


  useEffect(() => {
    setIsInitialized(true); // Simulate initialization
     // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resetCamera = useCallback(() => { // Added useCallback
    setTemporalControls(prev => ({ ...prev, cameraState: initialCameraState }));
     // If OrbitControls has a reset method, call it here.
     // This might require getting a ref to OrbitControls.
  }, []);


  const toggleFullscreen = useCallback(() => { // Added useCallback
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().catch(err => console.error("Fullscreen request failed:", err));
    } else {
      document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
    }
  }, []);

  const handleTemporalControlChange = useCallback((newControls: Partial<TemporalControlsState>) => { // Added useCallback
    setTemporalControls(prev => ({ ...prev, ...newControls }));
  }, []);

  const handleQualityChange = useCallback((newSettings: QualitySettings) => { // Added useCallback
    setQualitySettings(newSettings);
  }, []);

  // Memoize scene props to prevent unnecessary re-renders of Timeline3DScene
  const sceneProps = useMemo(() => ({
    events, agents, scenarios, temporalControls, qualitySettings, isPlaying, onPerformanceUpdate: setPerformance
  }), [events, agents, scenarios, temporalControls, qualitySettings, isPlaying]);


  // Example event handler for objects in 3D scene
  const handleEventClick = (event: ThreeEvent<MouseEvent>, timelineEventData: TimelineEvent3D) => {
    event.stopPropagation();
    setTooltip({
        content: `Event: ${timelineEventData.metadata.eventType} by ${timelineEventData.metadata.agentId} at ${timelineEventData.metadata.timestamp}ms`,
        x: event.clientX,
        y: event.clientY
    });
    // Could also set selected event for detail view
  };


  return (
    <div ref={canvasContainerRef} className="h-full flex flex-col bg-[var(--color-bg-deep-space)] relative text-white">
      {/* Header (simplified, main controls are overlays) */}
      <div className="bg-black/30 backdrop-blur-sm p-2 sm:p-3 flex items-center justify-between border-b border-white/10 absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)]" />
          <h2 className="text-base sm:text-lg font-bold">3D Timeline</h2>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button onClick={onPlayToggle} className="toolbar-button" title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={resetCamera} className="toolbar-button" title="Reset View"> <RotateCcw className="w-4 h-4" /> </button>
          <button onClick={toggleFullscreen} className="toolbar-button" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowPerformanceUI(!showPerformanceUI)} className={`toolbar-button ${showPerformanceUI ? 'active' : ''}`} title="Toggle Performance Monitor"> <Zap className="w-4 h-4" /> </button>
          <button onClick={() => setShowControlsUI(!showControlsUI)} className={`toolbar-button ${showControlsUI ? 'active' : ''}`} title="Toggle Timeline Controls"> <Settings className="w-4 h-4" /> </button>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div className="flex-1 relative pt-12"> {/* pt-12 for header height */}
        <Canvas
          gl={{
            antialias: qualitySettings.antialiasing, alpha: true, powerPreference: "high-performance",
            stencil: false, depth: true, logarithmicDepthBuffer: true // Helps with z-fighting in large scenes
          }}
          dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, qualitySettings.renderScale) : qualitySettings.renderScale} // Adjust DPR based on scale
          frameloop={isPlaying ? 'always' : 'demand'} // Optimize rendering loop
          shadows={qualitySettings.shadows ? "soft" : false} // Enable shadows based on settings
        >
          <PerspectiveCamera makeDefault position={temporalControls.cameraState.position} fov={temporalControls.cameraState.fov} near={0.1} far={1000} />
          <OrbitControls
            target={temporalControls.cameraState.target}
            enablePan={true} enableZoom={true} enableRotate={true}
            minDistance={1} maxDistance={100}
            maxPolarAngle={Math.PI -0.1} minPolarAngle={0.1} // Prevent camera from going below ground or too high
          />
          <Environment preset="night" background={false}/> {/* background=false to use CSS background */}
          <ambientLight intensity={qualitySettings.effectsQuality === 'low' ? 0.2 : 0.5} color="#505070" />
          <directionalLight position={[5, 10, 7]} intensity={qualitySettings.effectsQuality === 'low' ? 0.5 : 1.0} color="white" castShadow={qualitySettings.shadows as boolean} />

          <Suspense fallback={
            <Html center>
                <div className="text-white p-4 bg-black/50 rounded-md">Loading 3D Scene...</div>
            </Html>
          }>
            <Timeline3DScene {...sceneProps} />
          </Suspense>
          {showPerformanceUI && <Stats className="stats-panel" />}
        </Canvas>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-black/70 p-2 rounded-md text-xs shadow-lg pointer-events-none"
            style={{ left: tooltip.x + 10, top: tooltip.y + 10, transform: 'translateZ(0)' }} // Ensure tooltip is above canvas
            onMouseLeave={() => setTooltip(null)} // Hide tooltip if mouse leaves it (though it's pointer-events-none)
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* 2D UI Overlays - Temporal Controls */}
      {showControlsUI && (
        <TemporalControls3D
          controls={temporalControls}
          onChange={handleTemporalControlChange}
          isPlaying={isPlaying}
          onPlayToggle={onPlayToggle}
          maxTimestamp={60000} // Example: 60 seconds timeline
        />
      )}

      {/* Performance Monitor Overlay */}
      {showPerformanceUI && (
        <Performance3DMonitor
          metrics={performance}
          qualitySettings={qualitySettings}
          onQualityChange={handleQualityChange}
        />
      )}

      {/* Global styles for toolbar buttons etc. */}
      <style jsx global>{`
        .toolbar-button {
          padding: 0.35rem; /* sm:p-2 */
          background-color: transparent;
          color: var(--color-text-muted);
          border-radius: 0.375rem; /* rounded-md */
          transition: background-color 0.2s, color 0.2s;
        }
        .toolbar-button:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
        .toolbar-button.active {
            background-color: var(--color-primary);
            color: white;
        }
        .stats-panel > div { /* Style R3F Stats component */
            left: auto !important;
            right: 10px !important;
        }
      `}</style>
    </div>
  );
}

Timeline3DViewer.displayName = "Timeline3DViewer";
