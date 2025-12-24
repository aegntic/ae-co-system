// AegntiX 3D Temporal Controls - Revolutionary Timeline Navigation
// Advanced time scrubbing, playback, and branch control interface

import React, { useState, useCallback } from 'react'; // Added React, useCallback
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  GitFork,  // Changed from GitBranch
  Clock3,   // Changed from Clock
  Settings2, // For advanced settings toggle
  Eye,      // For View Mode
  Camera,   // For VR/AR Modes
  Globe,    // Changed from Navigation for God View
  Layers    // For Branch selection
} from 'lucide-react';
import { TemporalControlsState } from '../../types/timeline3d'; // Ensure this path is correct

interface TemporalControls3DProps {
  controls: TemporalControlsState; // Use the more specific type
  onChange: (newControls: Partial<TemporalControlsState>) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  maxTimestamp?: number; // Optional: max duration of the timeline in ms (e.g., 60000 for 60s)
}

export function TemporalControls3D({
  controls,
  onChange,
  isPlaying,
  onPlayToggle,
  maxTimestamp = 60000 // Default to 60 seconds
}: TemporalControls3DProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const speedOptions = [
    { value: -2, label: '-2x' }, { value: -1, label: '-1x' }, { value: -0.5, label: '-0.5x' },
    { value: 0.25, label: '¼x' }, { value: 0.5, label: '½x' }, { value: 1, label: '1x' },
    { value: 2, label: '2x' }, { value: 4, label: '4x' }, { value: 8, label: '8x' }, { value: 16, label: '16x' }
  ];

  const viewModes = [
    { value: '3D', label: '3D View', icon: Eye },
    { value: 'VR', label: 'VR Mode', icon: Camera },
    // { value: 'AR', label: 'AR Mode', icon: Navigation }, // Navigation might not be the best icon
    { value: 'God', label: 'God View', icon: Globe }
  ];

  const handleTimelineSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    onChange({ currentTimestamp: progress * maxTimestamp });
  }, [onChange, maxTimestamp]);

  const handleTimelineInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ currentTimestamp: parseFloat(event.target.value) });
  }, [onChange]);


  const handleSpeedChange = (speed: number) => onChange({ playbackSpeed: speed });
  const handleViewModeChange = (mode: string) => onChange({ viewMode: mode as TemporalControlsState['viewMode'] });
  const jumpToStart = () => onChange({ currentTimestamp: 0 });
  const jumpToEnd = () => onChange({ currentTimestamp: maxTimestamp });
  const skipTime = (amount: number) => onChange({ currentTimestamp: Math.max(0, Math.min(maxTimestamp, controls.currentTimestamp + amount)) });


  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000)/10); // two digits for ms
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };


  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-lg rounded-xl p-3 sm:p-4 shadow-2xl border border-white/10 text-white text-xs sm:text-sm w-[calc(100%-2rem)] max-w-2xl z-50">
      {/* Main Timeline Scrubber */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between space-x-2 sm:space-x-3 mb-1 sm:mb-2">
          <div className="flex items-center space-x-1.5">
            <Clock3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-primary)]" />
            <span className="font-medium">Timeline</span>
          </div>
          <span className="text-[var(--color-text-muted)]">
            {formatTime(controls.currentTimestamp)} / {formatTime(maxTimestamp)}
          </span>
        </div>

        <input
            type="range"
            min="0"
            max={maxTimestamp}
            value={controls.currentTimestamp}
            onChange={handleTimelineInputChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer timeline-slider accent-[var(--color-primary)]"
        />
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {[
            { action: jumpToStart, icon: Rewind, title: "Jump to Start" },
            { action: () => skipTime(-5000), icon: SkipBack, title: "Skip Backward 5s" }
          ].map(btn => (
            <button key={btn.title} onClick={btn.action} className="control-button" title={btn.title}>
              <btn.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          ))}

          <button
            onClick={onPlayToggle}
            className={`p-2 sm:p-2.5 rounded-full transition-all text-white ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {[
            { action: () => skipTime(5000), icon: SkipForward, title: "Skip Forward 5s" },
            { action: jumpToEnd, icon: FastForward, title: "Jump to End" }
          ].map(btn => (
            <button key={btn.title} onClick={btn.action} className="control-button" title={btn.title}>
              <btn.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          ))}
        </div>

        {/* Speed Control & Advanced Toggle */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <select
            value={controls.playbackSpeed}
            onChange={e => handleSpeedChange(parseFloat(e.target.value))}
            className="control-select text-xs"
            title="Playback Speed"
          >
            {speedOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`control-button ${showAdvanced ? 'bg-[var(--color-primary)] text-white' : ''}`}
            title="Advanced Controls"
          >
            <Settings2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* Advanced Controls Panel (Collapsible) */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Timeline Branches */}
            <div>
              <label className="block text-[10px] sm:text-xs text-[var(--color-text-muted)] mb-1">Branch</label>
              <select
                value={controls.activeBranchId}
                onChange={(e) => onChange({ activeBranchId: e.target.value })}
                className="control-select w-full"
                title="Select Timeline Branch"
              >
                <option value="main">Main Timeline</option>
                {/* Example branches, should be dynamic */}
                <option value="branch-alpha">Branch Alpha</option>
                <option value="branch-beta">Branch Beta</option>
              </select>
            </div>

            {/* Camera FOV */}
            <div>
              <label className="block text-[10px] sm:text-xs text-[var(--color-text-muted)] mb-1">
                FOV: {controls.cameraState.fov}°
              </label>
              <input
                type="range" min="30" max="120" value={controls.cameraState.fov}
                onChange={(e) => onChange({ cameraState: { ...controls.cameraState, fov: parseInt(e.target.value) }})}
                className="w-full h-2 timeline-slider accent-[var(--color-primary)]"
                title="Camera Field of View"
              />
            </div>
          </div>
          {/* View Mode Selection */}
          <div>
            <label className="block text-[10px] sm:text-xs text-[var(--color-text-muted)] mb-1">View Mode</label>
            <div className="flex items-center space-x-1 bg-black/20 p-0.5 rounded-md">
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => handleViewModeChange(mode.value)}
                    className={`flex-1 control-button text-xs p-1 sm:p-1.5 flex items-center justify-center space-x-1
                      ${controls.viewMode === mode.value ? 'bg-[var(--color-primary)] text-white' : ''}
                    `}
                    title={mode.label}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Basic styles for controls, can be moved to CSS */}
      <style jsx global>{`
        .control-button {
          padding: 0.4rem 0.6rem; /* sm:p-2 */
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-secondary);
          border-radius: 0.375rem; /* rounded-md */
          transition: background-color 0.2s, color 0.2s;
        }
        .control-button:hover {
          background-color: var(--color-border-primary);
          color: var(--color-text-primary);
        }
        .control-select {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          padding: 0.4rem 0.6rem;
          border-radius: 0.375rem;
          border: 1px solid var(--color-border-primary);
          appearance: none; /* For custom arrow if needed */
        }
        .timeline-slider { /* Custom styling for range inputs */
            -webkit-appearance: none;
            appearance: none;
            background: var(--color-bg-tertiary);
            border-radius: 9999px; /* rounded-full */
            border: 1px solid var(--color-border-primary);
        }
        .timeline-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px; /* sm:w-3 */
            height: 12px; /* sm:h-3 */
            background: white;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid var(--color-primary);
        }
        .timeline-slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            background: white;
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid var(--color-primary);
        }
      `}</style>
    </div>
  );
}

TemporalControls3D.displayName = "TemporalControls3D";
