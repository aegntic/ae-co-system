// AegntiX 3D Temporal Controls - Revolutionary Timeline Navigation
// Advanced time scrubbing, playback, and branch control interface

import { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Rewind, 
  FastForward,
  GitBranch,
  Clock,
  Zap,
  Eye,
  Camera,
  Navigation
} from 'lucide-react';
import { TemporalControls } from '../../types/timeline3d';

interface TemporalControls3DProps {
  controls: TemporalControls;
  onChange: (newControls: Partial<TemporalControls>) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

export function TemporalControls3D({ 
  controls, 
  onChange, 
  isPlaying, 
  onPlayToggle 
}: TemporalControls3DProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Playback speed options
  const speedOptions = [
    { value: -2, label: '-2x' },
    { value: -1, label: '-1x' },
    { value: -0.5, label: '-0.5x' },
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' },
    { value: 8, label: '8x' },
    { value: 16, label: '16x' }
  ];

  // View mode options
  const viewModes = [
    { value: '3D', label: '3D View', icon: Eye },
    { value: 'VR', label: 'VR Mode', icon: Camera },
    { value: 'AR', label: 'AR Mode', icon: Navigation },
    { value: 'God', label: 'God View', icon: Zap }
  ];

  const handleTimelineSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = (event.clientX - rect.left) / rect.width;
    const newTimestamp = progress * 60000; // 60 seconds max
    
    onChange({ currentTimestamp: newTimestamp });
  };

  const handleSpeedChange = (speed: number) => {
    onChange({ playbackSpeed: speed });
  };

  const handleViewModeChange = (mode: string) => {
    onChange({ viewMode: mode as any });
  };

  const jumpToStart = () => {
    onChange({ currentTimestamp: 0 });
  };

  const jumpToEnd = () => {
    onChange({ currentTimestamp: 60000 });
  };

  const skipBackward = () => {
    onChange({ 
      currentTimestamp: Math.max(0, controls.currentTimestamp - 5000) 
    });
  };

  const skipForward = () => {
    onChange({ 
      currentTimestamp: Math.min(60000, controls.currentTimestamp + 5000) 
    });
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-xl p-4 min-w-[600px]">
      {/* Main Timeline Scrubber */}
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white font-medium">Timeline Position</span>
          <span className="text-xs text-gray-400">
            {Math.round(controls.currentTimestamp / 1000)}s / 60s
          </span>
        </div>
        
        <div 
          className="relative bg-gray-700 rounded-full h-3 cursor-pointer group"
          onClick={handleTimelineSeek}
        >
          {/* Timeline track */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-30"></div>
          
          {/* Progress fill */}
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all"
            style={{ width: `${(controls.currentTimestamp / 60000) * 100}%` }}
          ></div>
          
          {/* Scrubber handle */}
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-blue-400 transition-all group-hover:scale-110"
            style={{ left: `${(controls.currentTimestamp / 60000) * 100}%`, marginLeft: '-10px' }}
          ></div>
          
          {/* Time markers */}
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 w-0.5 h-full bg-white/20"
              style={{ left: `${(i / 6) * 100}%` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={jumpToStart}
            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-all"
            title="Jump to Start"
          >
            <Rewind className="w-4 h-4" />
          </button>
          
          <button
            onClick={skipBackward}
            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-all"
            title="Skip Backward 5s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={onPlayToggle}
            className={`p-3 rounded-full transition-all ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={skipForward}
            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-all"
            title="Skip Forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          
          <button
            onClick={jumpToEnd}
            className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-all"
            title="Jump to End"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Speed:</span>
          <div className="flex items-center space-x-1">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSpeedChange(option.value)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  controls.playbackSpeed === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">View:</span>
          <div className="flex items-center space-x-1">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  onClick={() => handleViewModeChange(mode.value)}
                  className={`p-2 rounded transition-all ${
                    controls.viewMode === mode.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                  }`}
                  title={mode.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Controls Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded transition-all ${
            showAdvanced ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'
          } text-white`}
          title="Advanced Controls"
        >
          <GitBranch className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Controls Panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-3 gap-4">
            {/* Timeline Branches */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Timeline Branch</label>
              <select 
                value={controls.activeBranch}
                onChange={(e) => onChange({ activeBranch: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="main">Main Timeline</option>
                <option value="branch-1">Branch Alpha</option>
                <option value="branch-2">Branch Beta</option>
                <option value="branch-3">Branch Gamma</option>
              </select>
            </div>

            {/* Camera FOV */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">
                Camera FOV: {controls.cameraState.fov}°
              </label>
              <input
                type="range"
                min="30"
                max="120"
                value={controls.cameraState.fov}
                onChange={(e) => onChange({
                  cameraState: {
                    ...controls.cameraState,
                    fov: parseInt(e.target.value)
                  }
                })}
                className="w-full"
              />
            </div>

            {/* Timeline Focus */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Focus Mode</label>
              <select className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600">
                <option value="overview">Overview</option>
                <option value="agents">Follow Agents</option>
                <option value="events">Track Events</option>
                <option value="causality">Show Causality</option>
              </select>
            </div>
          </div>

          {/* Branch Comparison */}
          <div className="mt-3 flex items-center space-x-4">
            <span className="text-xs text-gray-400">Compare Branches:</span>
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-all">
              Main vs Alpha
            </button>
            <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-all">
              Split View
            </button>
            <button className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-all">
              Overlay Mode
            </button>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Branch: {controls.activeBranch}</span>
          <span>Speed: {controls.playbackSpeed}x</span>
          <span>Mode: {controls.viewMode}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>
      </div>
    </div>
  );
}