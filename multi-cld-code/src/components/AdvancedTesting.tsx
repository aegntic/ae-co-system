import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { PlayCircle, Cpu, Brain, CheckCircle, XCircle, Clock, Activity, Heart, Zap } from 'lucide-react';

interface StressTestResults {
  terminals_spawned: number;
  terminals_active: number;
  peak_memory_mb: number;
  avg_memory_mb: number;
  peak_cpu_percent: number;
  avg_cpu_percent: number;
  attention_detections: number;
  failed_spawns: number;
  test_duration_actual: number;
  performance_score: number;
}

interface AiTestResults {
  test_summary: {
    total_commands: number;
    successful: number;
    failed: number;
    avg_execution_time_ms: number;
  };
  detailed_results: Array<{
    command: string;
    success: boolean;
    execution_time_ms: number;
    error?: string;
    response_preview?: string;
  }>;
  ai_capabilities_status: string;
  recommendations: string[];
}

interface ConsciousnessTestResults {
  consciousness_test_summary: {
    total_tests: number;
    successful: number;
    failed: number;
    success_rate: number;
  };
  detailed_results: Array<{
    test: string;
    success: boolean;
    execution_time_ms: number;
    error?: string;
  }>;
  consciousness_status: string;
  capabilities_verified: string[];
}

const AdvancedTesting: React.FC = () => {
  const [stressTestRunning, setStressTestRunning] = useState(false);
  const [aiTestRunning, setAiTestRunning] = useState(false);
  const [consciousnessTestRunning, setConsciousnessTestRunning] = useState(false);
  const [stressResults, setStressResults] = useState<StressTestResults | null>(null);
  const [aiResults, setAiResults] = useState<AiTestResults | null>(null);
  const [consciousnessResults, setConsciousnessResults] = useState<ConsciousnessTestResults | null>(null);
  const [consciousnessSessionId, setConsciousnessSessionId] = useState<string | null>(null);
  const [performanceValid, setPerformanceValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');

  const runStressTest = async () => {
    setStressTestRunning(true);
    setMessage('Starting comprehensive stress test for 50+ concurrent terminals...');
    
    try {
      const results = await invoke<StressTestResults>('run_cctm_stress_test');
      setStressResults(results);
      setMessage(`Stress test completed! Performance score: ${results.performance_score.toFixed(1)}/100`);
    } catch (error) {
      setMessage(`Stress test failed: ${error}`);
    } finally {
      setStressTestRunning(false);
    }
  };

  const validatePerformance = async () => {
    setMessage('Running quick performance validation...');
    
    try {
      const isValid = await invoke<boolean>('validate_cctm_performance');
      setPerformanceValid(isValid);
      setMessage(isValid ? 'Performance validation PASSED ✅' : 'Performance validation FAILED ❌');
    } catch (error) {
      setMessage(`Performance validation error: ${error}`);
    }
  };

  const testAiCapabilities = async () => {
    setAiTestRunning(true);
    setMessage('Testing AI command processing capabilities...');
    
    try {
      const results = await invoke<AiTestResults>('test_ai_capabilities');
      setAiResults(results);
      setMessage(`AI testing completed! ${results.test_summary.successful}/${results.test_summary.total_commands} commands successful`);
    } catch (error) {
      setMessage(`AI testing failed: ${error}`);
    } finally {
      setAiTestRunning(false);
    }
  };

  const executeCustomAiCommand = async () => {
    const command = prompt('Enter AI command to test (e.g., "ae analyze code"):');
    if (!command) return;

    setMessage(`Executing: ${command}`);
    
    try {
      const result = await invoke('execute_ai_command', {
        request: {
          command,
          working_dir: '.',
          terminal_id: 'test_terminal_' + Date.now()
        }
      });
      
      setMessage(`AI command executed successfully: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
      setMessage(`AI command failed: ${error}`);
    }
  };

  const testConsciousnessCapabilities = async () => {
    setConsciousnessTestRunning(true);
    setMessage('Testing Consciousness Engine capabilities...');
    
    try {
      const results = await invoke<ConsciousnessTestResults>('test_consciousness_capabilities');
      setConsciousnessResults(results);
      setMessage(`Consciousness testing completed! ${results.consciousness_test_summary.successful}/${results.consciousness_test_summary.total_tests} tests passed (${results.consciousness_test_summary.success_rate.toFixed(1)}%)`);
    } catch (error) {
      setMessage(`Consciousness testing failed: ${error}`);
    } finally {
      setConsciousnessTestRunning(false);
    }
  };

  const initializeConsciousness = async () => {
    setMessage('Initializing consciousness for test developer...');
    
    try {
      const sessionId = await invoke<string>('initialize_consciousness', {
        request: {
          developer_id: 'test_developer_' + Date.now()
        }
      });
      
      setConsciousnessSessionId(sessionId);
      setMessage(`Consciousness initialized! Session ID: ${sessionId.substring(0, 8)}...`);
    } catch (error) {
      setMessage(`Consciousness initialization failed: ${error}`);
    }
  };

  const processConsciousnessInteraction = async () => {
    if (!consciousnessSessionId) {
      setMessage('Please initialize consciousness first');
      return;
    }

    setMessage('Processing consciousness interaction...');
    
    try {
      const result = await invoke('process_consciousness_interaction', {
        request: {
          session_id: consciousnessSessionId,
          interaction_type: 'code_question',
          content: 'Testing consciousness interaction with complex code analysis',
          satisfaction_level: 0.85,
          focus_duration_minutes: 45.0,
          code_complexity_level: 0.7,
          current_project_context: 'CCTM consciousness testing'
        }
      });
      
      setMessage(`Consciousness interaction processed successfully! Response type: ${result.response_type || 'N/A'}`);
    } catch (error) {
      setMessage(`Consciousness interaction failed: ${error}`);
    }
  };

  const enableFlowPreservation = async () => {
    if (!consciousnessSessionId) {
      setMessage('Please initialize consciousness first');
      return;
    }

    setMessage('Enabling flow preservation mode...');
    
    try {
      await invoke('enable_flow_preservation', { session_id: consciousnessSessionId });
      setMessage('Flow preservation mode enabled successfully! 🌊');
    } catch (error) {
      setMessage(`Flow preservation failed: ${error}`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">🚀 Advanced CCTM Testing</h2>
        <div className="text-sm text-gray-400">
          Validate 50+ terminal virtualization & AI capabilities
        </div>
      </div>

      {/* Performance Testing Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Cpu className="w-5 h-5 mr-2 text-red-400" />
          Performance Validation (Track A)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <motion.button
            onClick={validatePerformance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Activity className="w-4 h-4 mr-2" />
            Quick Validation (30s)
          </motion.button>
          
          <motion.button
            onClick={runStressTest}
            disabled={stressTestRunning}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {stressTestRunning ? 'Running Stress Test...' : 'Full Stress Test (5min)'}
          </motion.button>
        </div>

        {performanceValid !== null && (
          <div className={`p-3 rounded mb-4 ${performanceValid ? 'bg-green-600/20 border border-green-500' : 'bg-red-600/20 border border-red-500'}`}>
            <div className="flex items-center">
              {performanceValid ? <CheckCircle className="w-5 h-5 mr-2 text-green-400" /> : <XCircle className="w-5 h-5 mr-2 text-red-400" />}
              <span className="font-medium">
                Performance Validation: {performanceValid ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>
        )}

        {stressResults && (
          <div className="bg-gray-700 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">Stress Test Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Terminals Spawned</div>
                <div className="text-cyan-400 font-mono">{stressResults.terminals_spawned}</div>
              </div>
              <div>
                <div className="text-gray-400">Peak Memory</div>
                <div className="text-cyan-400 font-mono">{stressResults.peak_memory_mb.toFixed(1)}MB</div>
              </div>
              <div>
                <div className="text-gray-400">Peak CPU</div>
                <div className="text-cyan-400 font-mono">{stressResults.peak_cpu_percent.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-400">Performance Score</div>
                <div className={`font-mono ${stressResults.performance_score >= 80 ? 'text-green-400' : stressResults.performance_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {stressResults.performance_score.toFixed(1)}/100
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Testing Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          AI Capabilities Testing (Track B)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <motion.button
            onClick={testAiCapabilities}
            disabled={aiTestRunning}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Brain className="w-4 h-4 mr-2" />
            {aiTestRunning ? 'Testing AI Commands...' : 'Test AI Commands'}
          </motion.button>
          
          <motion.button
            onClick={executeCustomAiCommand}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Execute Custom AI Command
          </motion.button>
        </div>

        {aiResults && (
          <div className="bg-gray-700 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">AI Capabilities Test Results</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-400">Total Commands</div>
                <div className="text-cyan-400 font-mono">{aiResults.test_summary.total_commands}</div>
              </div>
              <div>
                <div className="text-gray-400">Successful</div>
                <div className="text-green-400 font-mono">{aiResults.test_summary.successful}</div>
              </div>
              <div>
                <div className="text-gray-400">Failed</div>
                <div className="text-red-400 font-mono">{aiResults.test_summary.failed}</div>
              </div>
              <div>
                <div className="text-gray-400">Avg Response Time</div>
                <div className="text-cyan-400 font-mono">{aiResults.test_summary.avg_execution_time_ms}ms</div>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-300">Command Results:</h5>
              {aiResults.detailed_results.map((result, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-2 text-sm">
                  <div className="flex items-center">
                    {result.success ? 
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> : 
                      <XCircle className="w-4 h-4 mr-2 text-red-400" />
                    }
                    <span className="font-mono">{result.command}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{result.execution_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Consciousness Testing Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-pink-400" />
          Consciousness Engine Testing (Track C)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <motion.button
            onClick={testConsciousnessCapabilities}
            disabled={consciousnessTestRunning}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart className="w-4 h-4 mr-2" />
            {consciousnessTestRunning ? 'Testing...' : 'Test Consciousness'}
          </motion.button>
          
          <motion.button
            onClick={initializeConsciousness}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Initialize Session
          </motion.button>
          
          <motion.button
            onClick={processConsciousnessInteraction}
            disabled={!consciousnessSessionId}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Brain className="w-4 h-4 mr-2" />
            Process Interaction
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <motion.button
            onClick={enableFlowPreservation}
            disabled={!consciousnessSessionId}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🌊 Enable Flow Preservation
          </motion.button>
          
          <div className="bg-gray-700 rounded p-2 text-sm">
            <div className="text-gray-400">Session Status:</div>
            <div className={consciousnessSessionId ? "text-green-400" : "text-gray-500"}>
              {consciousnessSessionId ? `Active (${consciousnessSessionId.substring(0, 8)}...)` : 'Not initialized'}
            </div>
          </div>
        </div>

        {consciousnessResults && (
          <div className="bg-gray-700 rounded p-4 mb-4">
            <h4 className="font-semibold mb-2">Consciousness Engine Test Results</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-gray-400">Total Tests</div>
                <div className="text-cyan-400 font-mono">{consciousnessResults.consciousness_test_summary.total_tests}</div>
              </div>
              <div>
                <div className="text-gray-400">Successful</div>
                <div className="text-green-400 font-mono">{consciousnessResults.consciousness_test_summary.successful}</div>
              </div>
              <div>
                <div className="text-gray-400">Failed</div>
                <div className="text-red-400 font-mono">{consciousnessResults.consciousness_test_summary.failed}</div>
              </div>
              <div>
                <div className="text-gray-400">Success Rate</div>
                <div className={`font-mono ${consciousnessResults.consciousness_test_summary.success_rate >= 90 ? 'text-green-400' : consciousnessResults.consciousness_test_summary.success_rate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {consciousnessResults.consciousness_test_summary.success_rate.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h5 className="font-medium text-gray-300 mb-2">Consciousness Status: 
                <span className={`ml-2 ${consciousnessResults.consciousness_status === 'fully_operational' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {consciousnessResults.consciousness_status.replace('_', ' ').toUpperCase()}
                </span>
              </h5>
              
              <div className="text-sm text-gray-400 mb-2">Verified Capabilities:</div>
              <div className="flex flex-wrap gap-2">
                {consciousnessResults.capabilities_verified.map((capability, index) => (
                  <span key={index} className="bg-pink-600/20 text-pink-300 px-2 py-1 rounded text-xs">
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="font-medium text-gray-300">Test Results:</h5>
              {consciousnessResults.detailed_results.map((result, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-800 rounded p-2 text-sm">
                  <div className="flex items-center">
                    {result.success ? 
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> : 
                      <XCircle className="w-4 h-4 mr-2 text-red-400" />
                    }
                    <span className="font-mono">{result.test}</span>
                  </div>
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{result.execution_time_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className="bg-gray-700 border border-gray-600 rounded p-3 mb-4">
          <div className="text-sm text-gray-300">{message}</div>
        </div>
      )}

      {/* Summary */}
      <div className="text-center text-gray-400 text-sm">
        Advanced testing validates CCTM's revolutionary claims: 50+ concurrent terminals + AI-powered natural language commands + Sentient Code Companion
      </div>
    </div>
  );
};

export default AdvancedTesting;