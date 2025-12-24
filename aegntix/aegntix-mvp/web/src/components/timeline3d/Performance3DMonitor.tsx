// AegntiX 3D Performance Monitor - Real-time 3D Optimization Dashboard
// Elite-tier performance tracking and quality management

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import {
  Zap,
  Monitor,
  Activity,
  Settings2 as Settings, // Renamed for consistency
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown, // For expand/collapse
  ChevronUp   // For expand/collapse
} from 'lucide-react';
import { Performance3DMetrics, QualitySettings, QualityLevel } from '../../types/timeline3d'; // Ensure QualityLevel is imported

interface Performance3DMonitorProps {
  metrics: Performance3DMetrics;
  qualitySettings: QualitySettings;
  onQualityChange: (newSettings: QualitySettings) => void; // Changed to newSettings for clarity
  initialExpanded?: boolean; // Allow setting initial state
}

export function Performance3DMonitor({
  metrics,
  qualitySettings,
  onQualityChange,
  initialExpanded = false
}: Performance3DMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);

  // Memoize auto-optimization to prevent re-creation on every render
  const autoOptimizeEnabled = qualitySettings.autoAdjustQuality;

  const handleAutoOptimizeToggle = useCallback(() => {
    onQualityChange({
      ...qualitySettings,
      autoAdjustQuality: !qualitySettings.autoAdjustQuality
    });
  }, [qualitySettings, onQualityChange]);


  // Track performance history for graphs
  useEffect(() => {
    setPerformanceHistory(prev => {
      const newHistory = [...prev, metrics.fps];
      return newHistory.slice(-30); // Keep last 30 readings (approx 30 seconds if updated per sec)
    });

    // Auto-optimization logic
    if (autoOptimizeEnabled) {
      let updatedSettings = { ...qualitySettings };
      let changed = false;

      if (metrics.fps < 30 && qualitySettings.particleQuality !== 'low') {
        updatedSettings = { ...updatedSettings, particleQuality: 'low', effectsQuality: 'low', shadows: false, antialiasing: false };
        changed = true;
      } else if (metrics.fps < 45 && qualitySettings.particleQuality === 'high') {
        updatedSettings = { ...updatedSettings, particleQuality: 'medium', effectsQuality: 'medium' };
        changed = true;
      } else if (metrics.fps > 55 && qualitySettings.particleQuality === 'low' && qualitySettings.renderScale < 1) {
         // If FPS is good and quality is low, try to improve it slightly
        updatedSettings = { ...updatedSettings, particleQuality: 'medium', renderScale: 1.0 };
        changed = true;
      }

      if (changed) {
        onQualityChange(updatedSettings);
      }
    }
  }, [metrics.fps, autoOptimizeEnabled, qualitySettings, onQualityChange]);

  const getPerformanceStatus = () => {
    if (metrics.fps >= 55) return { status: 'Excellent', color: 'text-green-400', icon: CheckCircle };
    if (metrics.fps >= 45) return { status: 'Good', color: 'text-yellow-400', icon: CheckCircle };
    if (metrics.fps >= 30) return { status: 'Fair', color: 'text-orange-400', icon: AlertTriangle };
    return { status: 'Poor', color: 'text-red-400', icon: AlertTriangle };
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  const handleQualityPreset = (preset: QualityLevel) => {
    const presets: Record<QualityLevel, Partial<QualitySettings>> = {
      low: { renderScale: 0.75, antialiasing: false, shadows: false, particleQuality: 'low', geometryDetail: 'low', effectsQuality: 'low', autoAdjustQuality: false },
      medium: { renderScale: 1.0, antialiasing: true, shadows: false, particleQuality: 'medium', geometryDetail: 'medium', effectsQuality: 'medium', autoAdjustQuality: false },
      high: { renderScale: 1.0, antialiasing: true, shadows: true, particleQuality: 'high', geometryDetail: 'high', effectsQuality: 'high', autoAdjustQuality: false },
      ultra: { renderScale: 1.25, antialiasing: true, shadows: true, particleQuality: 'ultra', geometryDetail: 'high', effectsQuality: 'high', autoAdjustQuality: false }
    };
    onQualityChange({ ...qualitySettings, ...presets[preset] });
  };

  const qualityLevels: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];


  return (
    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden text-white text-xs sm:text-sm max-w-xs sm:max-w-sm z-50">
      {/* Compact Header */}
      <div className="p-2 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-primary)]" />
          <span className="font-medium">Performance</span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <StatusIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${performanceStatus.color}`} />
          <span className={`font-bold ${performanceStatus.color}`}>
            {metrics.fps} FPS
          </span>
          <button
            className="p-0.5 sm:p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-white/10 p-3 sm:p-4 w-full"> {/* Ensure full width for content */}
          {/* Performance Metrics */}
          <div className="mb-3">
            <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-time Metrics</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
              {[
                { label: 'Frame Time', value: `${metrics.frameTime.toFixed(1)}ms`, ok: metrics.frameTime < 20, warn: metrics.frameTime < 30 },
                { label: 'Draw Calls', value: metrics.drawCalls, ok: metrics.drawCalls < 100, warn: metrics.drawCalls < 200 },
                { label: 'Triangles', value: `${(metrics.triangles / 1000).toFixed(1)}K`, ok: metrics.triangles < 500000, warn: metrics.triangles < 1000000 },
                { label: 'Geometries', value: metrics.geometries, ok: metrics.geometries < 100, warn: metrics.geometries < 200 }
              ].map(item => (
                <div key={item.label} className="bg-black/30 rounded p-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">{item.label}</span>
                    <span className={`font-medium ${item.ok ? 'text-green-400' : item.warn ? 'text-yellow-400' : 'text-red-400'}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* FPS History Graph */}
            <div className="mt-2">
              <div className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mb-0.5">FPS History (30s)</div>
              <div className="h-6 sm:h-8 bg-black/30 rounded relative overflow-hidden border border-white/10">
                {performanceHistory.length > 1 && (
                  <svg className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="1"
                      points={performanceHistory.map((fps, i) =>
                        `${(i / (performanceHistory.length - 1)) * 100} ${100 - Math.min(100, (fps / 70) * 100)}` // Cap FPS at 70 for graph scaling
                      ).join(' ')}
                    />
                  </svg>
                )}
                <div className="absolute top-1/3 left-0 w-full border-t border-green-400/20"></div> {/* 60 FPS line (approx) */}
              </div>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="mb-3">
            <h4 className="text-xs sm:text-sm font-medium mb-2 flex items-center space-x-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>Quality Settings</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-2">
              {qualityLevels.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleQualityPreset(preset)}
                  className={`px-1.5 py-0.5 text-[10px] sm:text-xs rounded transition-colors capitalize
                    ${qualitySettings.particleQuality === preset && !qualitySettings.autoAdjustQuality // A bit simplistic way to show current preset
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-black/30 hover:bg-white/10'
                    }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="space-y-1.5 text-[10px] sm:text-xs">
              <RangeInput label="Render Scale" value={qualitySettings.renderScale} min={0.5} max={1.5} step={0.25} onChange={val => onQualityChange({...qualitySettings, renderScale: val})} unit="x" />
              <SelectInput label="Particles" value={qualitySettings.particleQuality} options={qualityLevels} onChange={val => onQualityChange({...qualitySettings, particleQuality: val as QualityLevel})} />
              <ToggleInput label="Antialiasing" checked={qualitySettings.antialiasing} onChange={val => onQualityChange({...qualitySettings, antialiasing: val})} />
              <ToggleInput label="Shadows" checked={qualitySettings.shadows as boolean} onChange={val => onQualityChange({...qualitySettings, shadows: val})} />
            </div>
          </div>

          {/* Auto-Optimization */}
          <div className="border-t border-white/10 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span className="text-xs sm:text-sm">Auto-Optimize</span>
              </div>
              <button
                onClick={handleAutoOptimizeToggle}
                className={`px-2 py-0.5 text-[10px] sm:text-xs rounded transition-colors ${
                  autoOptimizeEnabled
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-black/30 hover:bg-white/10'
                }`}
              >
                {autoOptimizeEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p className="text-[9px] sm:text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Adjusts quality to maintain target FPS.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components for inputs
const RangeInput: React.FC<{label:string, value:number, min:number, max:number, step:number, onChange:(val:number)=>void, unit?:string}> =
({label, value, min, max, step, onChange, unit=""}) => (
  <div className="flex items-center justify-between">
    <span className="text-[var(--color-text-muted)]">{label}</span>
    <div className="flex items-center space-x-1">
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-12 sm:w-16 accent-[var(--color-primary)]" />
      <span className="text-white w-6 text-right">{value.toFixed(unit === 'x' ? 2:0)}{unit}</span>
    </div>
  </div>
);

const SelectInput: React.FC<{label:string, value:string, options:string[], onChange:(val:string)=>void}> =
({label, value, options, onChange}) => (
  <div className="flex items-center justify-between">
    <span className="text-[var(--color-text-muted)]">{label}</span>
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-black/30 text-white text-[10px] sm:text-xs rounded px-1 py-0.5 border border-white/10 focus:outline-none focus:border-[var(--color-primary)]">
      {options.map(opt => <option key={opt} value={opt} className="capitalize bg-gray-800">{opt}</option>)}
    </select>
  </div>
);

const ToggleInput: React.FC<{label:string, checked:boolean, onChange:(val:boolean)=>void}> =
({label, checked, onChange}) => (
  <div className="flex items-center justify-between">
    <span className="text-[var(--color-text-muted)]">{label}</span>
    <button onClick={() => onChange(!checked)} className={`px-2 py-0.5 text-[10px] sm:text-xs rounded transition-colors ${checked ? 'bg-[var(--color-primary)] text-white' : 'bg-black/30 hover:bg-white/10'}`}>
      {checked ? 'On' : 'Off'}
    </button>
  </div>
);

Performance3DMonitor.displayName = "Performance3DMonitor";
