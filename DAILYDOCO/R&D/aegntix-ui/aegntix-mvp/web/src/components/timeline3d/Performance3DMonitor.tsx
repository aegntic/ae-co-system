// AegntiX 3D Performance Monitor - Real-time 3D Optimization Dashboard
// Elite-tier performance tracking and quality management

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Monitor, 
  Activity, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { Performance3DMetrics, QualitySettings } from '../../types/timeline3d';

interface Performance3DMonitorProps {
  metrics: Performance3DMetrics;
  qualitySettings: QualitySettings;
  onQualityChange: (settings: QualitySettings) => void;
}

export function Performance3DMonitor({ 
  metrics, 
  qualitySettings, 
  onQualityChange 
}: Performance3DMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([]);
  const [autoOptimizeEnabled, setAutoOptimizeEnabled] = useState(qualitySettings.autoQuality);

  // Track performance history for graphs
  useEffect(() => {
    setPerformanceHistory(prev => {
      const newHistory = [...prev, metrics.fps];
      return newHistory.slice(-30); // Keep last 30 readings
    });

    // Auto-optimization logic
    if (autoOptimizeEnabled) {
      if (metrics.fps < 45 && qualitySettings.particleQuality !== 'low') {
        onQualityChange({
          ...qualitySettings,
          particleQuality: 'medium',
          effectsQuality: 'medium'
        });
      } else if (metrics.fps < 30) {
        onQualityChange({
          ...qualitySettings,
          particleQuality: 'low',
          effectsQuality: 'low',
          shadows: false,
          antialiasing: false
        });
      } else if (metrics.fps > 55 && qualitySettings.particleQuality === 'low') {
        onQualityChange({
          ...qualitySettings,
          particleQuality: 'medium'
        });
      }
    }
  }, [metrics.fps, autoOptimizeEnabled, qualitySettings, onQualityChange]);

  const getPerformanceStatus = () => {
    if (metrics.fps >= 55) return { status: 'excellent', color: 'text-green-400', icon: CheckCircle };
    if (metrics.fps >= 45) return { status: 'good', color: 'text-yellow-400', icon: CheckCircle };
    if (metrics.fps >= 30) return { status: 'fair', color: 'text-orange-400', icon: AlertTriangle };
    return { status: 'poor', color: 'text-red-400', icon: AlertTriangle };
  };

  const performanceStatus = getPerformanceStatus();
  const StatusIcon = performanceStatus.icon;

  const handleQualityPreset = (preset: 'low' | 'medium' | 'high' | 'ultra') => {
    const presets = {
      low: {
        renderScale: 0.75,
        antialiasing: false,
        shadows: false,
        particleQuality: 'low' as const,
        geometryDetail: 'low' as const,
        effectsQuality: 'low' as const,
        autoQuality: false
      },
      medium: {
        renderScale: 1.0,
        antialiasing: true,
        shadows: false,
        particleQuality: 'medium' as const,
        geometryDetail: 'medium' as const,
        effectsQuality: 'medium' as const,
        autoQuality: false
      },
      high: {
        renderScale: 1.0,
        antialiasing: true,
        shadows: true,
        particleQuality: 'high' as const,
        geometryDetail: 'high' as const,
        effectsQuality: 'high' as const,
        autoQuality: false
      },
      ultra: {
        renderScale: 1.25,
        antialiasing: true,
        shadows: true,
        particleQuality: 'ultra' as const,
        geometryDetail: 'high' as const,
        effectsQuality: 'high' as const,
        autoQuality: false
      }
    };

    onQualityChange({ ...qualitySettings, ...presets[preset] });
  };

  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl overflow-hidden">
      {/* Compact Header */}
      <div className="p-3 flex items-center justify-between min-w-[200px]">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Performance</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${performanceStatus.color}`} />
          <span className={`text-sm font-bold ${performanceStatus.color}`}>
            {metrics.fps} FPS
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 w-80">
          {/* Performance Metrics */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Real-time Metrics</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Frame Time</span>
                  <span className="text-white font-medium">{metrics.frameTime.toFixed(1)}ms</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div 
                    className={`h-1 rounded-full ${
                      metrics.frameTime < 20 ? 'bg-green-400' : 
                      metrics.frameTime < 30 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (metrics.frameTime / 50) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Draw Calls</span>
                  <span className="text-white font-medium">{metrics.drawCalls}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div 
                    className={`h-1 rounded-full ${
                      metrics.drawCalls < 100 ? 'bg-green-400' : 
                      metrics.drawCalls < 200 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (metrics.drawCalls / 300) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Triangles</span>
                  <span className="text-white font-medium">{(metrics.triangles / 1000).toFixed(1)}K</span>
                </div>
              </div>

              <div className="bg-gray-800 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Geometries</span>
                  <span className="text-white font-medium">{metrics.geometries}</span>
                </div>
              </div>
            </div>

            {/* FPS History Graph */}
            <div className="mt-3">
              <div className="text-xs text-gray-400 mb-1">FPS History (30s)</div>
              <div className="h-8 bg-gray-800 rounded relative overflow-hidden">
                <svg className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    points={performanceHistory.map((fps, i) => 
                      `${(i / (performanceHistory.length - 1)) * 100},${100 - (fps / 60) * 100}`
                    ).join(' ')}
                  />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex items-center">
                  <div className="w-full border-t border-green-400/30" style={{ marginTop: '33%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Settings */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Quality Settings</span>
            </h4>
            
            {/* Quality Presets */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {['low', 'medium', 'high', 'ultra'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleQualityPreset(preset as any)}
                  className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors capitalize"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Individual Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Render Scale</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={qualitySettings.renderScale}
                  onChange={(e) => onQualityChange({
                    ...qualitySettings,
                    renderScale: parseFloat(e.target.value)
                  })}
                  className="w-20"
                />
                <span className="text-xs text-white w-8 text-right">
                  {qualitySettings.renderScale}x
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Particle Quality</span>
                <select
                  value={qualitySettings.particleQuality}
                  onChange={(e) => onQualityChange({
                    ...qualitySettings,
                    particleQuality: e.target.value as any
                  })}
                  className="bg-gray-700 text-white text-xs rounded px-2 py-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Antialiasing</span>
                <button
                  onClick={() => onQualityChange({
                    ...qualitySettings,
                    antialiasing: !qualitySettings.antialiasing
                  })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    qualitySettings.antialiasing
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {qualitySettings.antialiasing ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Shadows</span>
                <button
                  onClick={() => onQualityChange({
                    ...qualitySettings,
                    shadows: !qualitySettings.shadows
                  })}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    qualitySettings.shadows
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {qualitySettings.shadows ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Auto-Optimization */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-white">Auto-Optimize</span>
              </div>
              <button
                onClick={() => {
                  setAutoOptimizeEnabled(!autoOptimizeEnabled);
                  onQualityChange({
                    ...qualitySettings,
                    autoQuality: !autoOptimizeEnabled
                  });
                }}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  autoOptimizeEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                {autoOptimizeEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Automatically adjusts quality to maintain 45+ FPS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}