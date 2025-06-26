import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Settings, Layout, Palette, Terminal, TestTube } from 'lucide-react'
import TerminalGrid from './components/TerminalGrid'
import ControlPanel from './components/ControlPanel'
import TuiLauncher from './components/TuiLauncher'
import AdvancedTesting from './components/AdvancedTesting'
import useTerminalStore from './store/terminalStore'
import './App.css'

function App() {
  const [showControlPanel, setShowControlPanel] = useState(false)
  const [showTuiLauncher, setShowTuiLauncher] = useState(false)
  const [showAdvancedTesting, setShowAdvancedTesting] = useState(false)
  const { terminals, opacity, addTerminal, updateTerminal, toggleAttention } = useTerminalStore()

  // Demo: Add sample terminals and simulate attention
  useEffect(() => {
    // Add demo terminals
    setTimeout(() => {
      addTerminal({
        title: 'Claude Code - DAILYDOCO',
        workingDir: '/home/tabs/ae-co-system/DAILYDOCO',
        status: 'running',
        needsAttention: false,
        output: [
          'Starting Claude Code in DAILYDOCO...',
          'Loading project configuration...',
          'Analyzing codebase structure...',
          'Ready for AI assistance!'
        ],
      })
    }, 500)

    setTimeout(() => {
      addTerminal({
        title: 'Claude Code - Multi-Terminal',
        workingDir: '/home/tabs/ae-co-system/multi-cld-code',
        status: 'waiting',
        needsAttention: false,
        output: [
          'Claude Code Terminal Manager initialized',
          'Building revolutionary terminal orchestration...',
          'Please select an action:',
          '1. Continue development',
          '2. Run tests',
          '3. Deploy MVP'
        ],
      })
    }, 1000)

    setTimeout(() => {
      addTerminal({
        title: 'Claude Code - aegnt-27',
        workingDir: '/home/tabs/ae-co-system/aegnt-27',
        status: 'running',
        needsAttention: false,
        output: [
          'Human Peak Protocol initializing...',
          'AI authenticity engine: ACTIVE',
          'Detection resistance: 97.3%',
          'Awaiting human co-creation...'
        ],
      })
    }, 1500)

    // Simulate attention needed after 3 seconds
    setTimeout(() => {
      // Find the second terminal (waiting status) and make it need attention
      const waitingTerminal = useTerminalStore.getState().terminals.find(t => t.status === 'waiting')
      if (waitingTerminal) {
        toggleAttention(waitingTerminal.id, true)
        updateTerminal(waitingTerminal.id, { 
          output: [
            ...waitingTerminal.output,
            '',
            '⚠️  USER INPUT REQUIRED',
            'Please provide your choice [1-3]:'
          ]
        })
      }
    }, 4000)
  }, [])

  return (
    <div className="app-container" style={{ opacity }}>
      {/* Main Terminal Grid */}
      <TerminalGrid />
      
      {/* Auto-hide Control Panel */}
      <ControlPanel 
        isVisible={showControlPanel}
        onClose={() => setShowControlPanel(false)}
      />
      
      {/* TUI Launcher Modal */}
      {showTuiLauncher && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <TuiLauncher />
            <button
              onClick={() => setShowTuiLauncher(false)}
              className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Close TUI Launcher
            </button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Advanced Testing Modal */}
      {showAdvancedTesting && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="max-w-6xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <AdvancedTesting />
            <button
              onClick={() => setShowAdvancedTesting(false)}
              className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              Close Advanced Testing
            </button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Control Panel Trigger */}
      <motion.div
        className="control-trigger"
        onHoverStart={() => setShowControlPanel(true)}
        initial={{ x: -40 }}
        animate={{ x: showControlPanel ? 0 : -40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="trigger-icons">
          <Plus className="w-4 h-4" />
          <Settings className="w-4 h-4" />
          <Layout className="w-4 h-4" />
          <Palette className="w-4 h-4" />
        </div>
      </motion.div>
      
      {/* TUI Launcher Trigger */}
      <motion.div
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg cursor-pointer z-40"
        onClick={() => setShowTuiLauncher(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Terminal className="w-6 h-6" />
      </motion.div>
      
      {/* Advanced Testing Trigger */}
      <motion.div
        className="fixed bottom-6 right-20 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg cursor-pointer z-40"
        onClick={() => setShowAdvancedTesting(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <TestTube className="w-6 h-6" />
      </motion.div>
      
      {/* Status Bar */}
      <div className="status-bar">
        <span className="terminal-count">Terminals: {terminals.length}</span>
        <span className="opacity-indicator">Opacity: {Math.round(opacity * 100)}%</span>
        <span className="demo-note">🚀 {{ae}} CCTM v0.2.0 - Advanced Terminal Manager with TUI</span>
      </div>
    </div>
  )
}

export default App