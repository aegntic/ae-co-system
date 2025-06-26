import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TuiStatus {
  tui_integration: string;
  available_versions: {
    advanced: {
      available: boolean;
      description: string;
      features: string[];
    };
    predictive: {
      available: boolean;
      description: string;
      features: string[];
    };
    simple: {
      available: boolean;
      description: string;
      features: string[];
    };
  };
  launcher: {
    available: boolean;
    interactive: boolean;
  };
  build_system: {
    cargo_available: boolean;
    rust_compilation: boolean;
  };
  integration_status: string;
  version: string;
}

const TuiLauncher: React.FC = () => {
  const [tuiStatus, setTuiStatus] = useState<TuiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadTuiStatus();
  }, []);

  const loadTuiStatus = async () => {
    try {
      const status = await invoke<TuiStatus>('get_tui_status');
      setTuiStatus(status);
    } catch (error) {
      console.error('Failed to load TUI status:', error);
      setMessage('Failed to load TUI status');
    }
  };

  const launchTui = async (type: 'advanced' | 'predictive' | 'simple' | 'interactive') => {
    setLoading(true);
    setMessage('');
    
    try {
      let result: string;
      
      switch (type) {
        case 'advanced':
          result = await invoke<string>('launch_tui_advanced');
          break;
        case 'predictive':
          result = await invoke<string>('launch_tui_predictive');
          break;
        case 'simple':
          result = await invoke<string>('launch_tui_simple');
          break;
        case 'interactive':
          result = await invoke<string>('launch_tui_interactive');
          break;
        default:
          throw new Error('Unknown TUI type');
      }
      
      setMessage(result);
    } catch (error) {
      console.error('Failed to launch TUI:', error);
      setMessage(`Failed to launch TUI: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!tuiStatus) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="text-white">Loading TUI status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
          <span className="text-cyan-400">{'{ae}'}</span>
          <span className="mx-2">CCTM TUI Integration</span>
          <span className="text-sm bg-green-500 text-white px-2 py-1 rounded-full">
            v{tuiStatus.version}
          </span>
        </h2>
        <p className="text-gray-300">
          Launch sophisticated terminal user interfaces with advanced AI capabilities
        </p>
        <div className="mt-2 text-sm text-green-400">
          ✅ Integration Status: {tuiStatus.integration_status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Advanced TUI */}
        <div className="bg-gray-700 rounded-lg p-4 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🎯 Advanced TUI
              {tuiStatus.available_versions.advanced.available && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Ready
                </span>
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            {tuiStatus.available_versions.advanced.description}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {tuiStatus.available_versions.advanced.features.map((feature) => (
              <span
                key={feature}
                className="text-xs bg-cyan-600 text-white px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
          <button
            onClick={() => launchTui('advanced')}
            disabled={!tuiStatus.available_versions.advanced.available || loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? 'Launching...' : 'Launch Advanced TUI'}
          </button>
        </div>

        {/* Predictive TUI */}
        <div className="bg-gray-700 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🧠 Predictive TUI
              {tuiStatus.available_versions.predictive.available && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Ready
                </span>
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            {tuiStatus.available_versions.predictive.description}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {tuiStatus.available_versions.predictive.features.map((feature) => (
              <span
                key={feature}
                className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
          <button
            onClick={() => launchTui('predictive')}
            disabled={!tuiStatus.available_versions.predictive.available || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? 'Launching...' : 'Launch Predictive TUI'}
          </button>
        </div>

        {/* Simple TUI */}
        <div className="bg-gray-700 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              📊 Simple TUI
              {tuiStatus.available_versions.simple.available && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Ready
                </span>
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            {tuiStatus.available_versions.simple.description}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {tuiStatus.available_versions.simple.features.map((feature) => (
              <span
                key={feature}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
          <button
            onClick={() => launchTui('simple')}
            disabled={!tuiStatus.available_versions.simple.available || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? 'Launching...' : 'Launch Simple TUI'}
          </button>
        </div>

        {/* Interactive Launcher */}
        <div className="bg-gray-700 rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center">
              🚀 Interactive Launcher
              {tuiStatus.launcher.available && (
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  Ready
                </span>
              )}
            </h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Launch the interactive TUI selection menu
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
              interactive
            </span>
            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
              menu
            </span>
          </div>
          <button
            onClick={() => launchTui('interactive')}
            disabled={!tuiStatus.launcher.available || loading}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? 'Launching...' : 'Launch Interactive Menu'}
          </button>
        </div>
      </div>

      {/* Build System Status */}
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Build System Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            {tuiStatus.build_system.cargo_available ? '✅' : '❌'}
            <span className="ml-2">Cargo Available</span>
          </div>
          <div className="flex items-center">
            {tuiStatus.build_system.rust_compilation ? '✅' : '❌'}
            <span className="ml-2">Rust Compilation</span>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('Failed') || message.includes('Error') 
            ? 'bg-red-600/20 border border-red-500 text-red-200' 
            : 'bg-green-600/20 border border-green-500 text-green-200'
        }`}>
          <div className="text-sm font-mono">{message}</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-600">
        <div className="text-center text-sm text-gray-400">
          <span className="text-cyan-400">{'{ae}'}</span> | aegntic.ai | Revolutionary AI Development Tools
        </div>
      </div>
    </div>
  );
};

export default TuiLauncher;