import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FolderOpen, Settings, Layout, Palette, Sliders, FileText, Edit3 } from 'lucide-react'
import useTerminalStore from '../store/terminalStore'
import ClaudeMdEditor from './ClaudeMdEditor'

interface ControlPanelProps {
  isVisible: boolean
  onClose: () => void
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'terminals' | 'layout' | 'themes' | 'settings'>('terminals')
  const [showClaudeMdEditor, setShowClaudeMdEditor] = useState(false)
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const { 
    terminals, 
    opacity, 
    setOpacity, 
    spawnClaudeCode, 
    setLayout, 
    layout,
    theme,
    setTheme,
    selectDirectory,
    detectProjectType,
    isLoading,
    error
  } = useTerminalStore()

  const handleNewTerminal = async () => {
    const workingDir = await selectDirectory()
    if (workingDir) {
      // Detect project type and generate appropriate title
      const projectType = await useTerminalStore.getState().detectProjectType(workingDir)
      const title = projectType !== 'unknown' 
        ? `${projectType.toUpperCase()} - Claude Code`
        : undefined
      
      await spawnClaudeCode(workingDir, title)
    }
  }

  const handleOpenClaudeMdEditor = async () => {
    if (selectedDirectory) {
      // Use already selected directory
      setShowClaudeMdEditor(true)
    } else {
      // Need to select a directory first
      const workingDir = await selectDirectory()
      if (workingDir) {
        setSelectedDirectory(workingDir)
        setShowClaudeMdEditor(true)
      }
    }
  }

  const handleBrowseProjects = async () => {
    const workingDir = await selectDirectory()
    if (workingDir) {
      setSelectedDirectory(workingDir)
      // Could open a project browser here in the future
    }
  }

  const layoutPresets = [
    { name: '1x1', columns: 1, rows: 1 },
    { name: '2x1', columns: 2, rows: 1 },
    { name: '2x2', columns: 2, rows: 2 },
    { name: '3x2', columns: 3, rows: 2 },
    { name: '4x2', columns: 4, rows: 2 },
  ]

  const themePresets = [
    { name: 'Default', type: 'default' },
    { name: 'Focus', type: 'focus' },
    { name: 'Ambient', type: 'ambient' },
    { name: 'Debug', type: 'debug' },
    { name: 'Presentation', type: 'presentation' },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="control-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            className="control-panel"
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Panel Header */}
            <div className="panel-header">
              <h2>CCTM Control Center</h2>
              <div className="header-status">
                {isLoading && (
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                  </div>
                )}
                <button onClick={onClose} className="close-btn">×</button>
              </div>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="error-banner">
                <span className="error-text">{error}</span>
                <button 
                  onClick={() => useTerminalStore.getState().setError(null)}
                  className="error-close"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Tab Navigation */}
            <div className="panel-tabs">
              {[
                { id: 'terminals', icon: Plus, label: 'Terminals' },
                { id: 'layout', icon: Layout, label: 'Layout' },
                { id: 'themes', icon: Palette, label: 'Themes' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="panel-content">
              {activeTab === 'terminals' && (
                <div className="tab-pane">
                  <div className="section">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button 
                        onClick={handleNewTerminal}
                        className="action-button primary"
                      >
                        <Plus className="w-4 h-4" />
                        New Terminal
                      </button>
                      
                      <button 
                        onClick={handleBrowseProjects}
                        className="action-button"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Browse Projects
                      </button>
                      
                      <button 
                        onClick={handleOpenClaudeMdEditor}
                        className="action-button"
                      >
                        <Edit3 className="w-4 h-4" />
                        CLAUDE.md Editor
                      </button>
                    </div>
                  </div>
                  
                  <div className="section">
                    <h3>Active Terminals ({terminals.length})</h3>
                    <div className="terminal-list">
                      {terminals.map((terminal) => (
                        <div key={terminal.id} className="terminal-item">
                          <div className="terminal-info">
                            <span className="terminal-name">{terminal.title}</span>
                            <span className={`terminal-status ${terminal.status}`}>
                              {terminal.status}
                            </span>
                          </div>
                          <div className="terminal-actions">
                            {terminal.needsAttention && (
                              <span className="attention-badge">!</span>
                            )}
                            <span className="pid">PID: {terminal.pid || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'layout' && (
                <div className="tab-pane">
                  <div className="section">
                    <h3>Layout Presets</h3>
                    <div className="layout-grid">
                      {layoutPresets.map((preset) => (
                        <button
                          key={preset.name}
                          className={`layout-btn ${
                            layout.columns === preset.columns && layout.rows === preset.rows 
                              ? 'active' : ''
                          }`}
                          onClick={() => setLayout(preset)}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="section">
                    <h3>Custom Layout</h3>
                    <div className="layout-controls">
                      <div className="control-group">
                        <label>Columns: {layout.columns}</label>
                        <input
                          type="range"
                          min="1"
                          max="6"
                          value={layout.columns}
                          onChange={(e) => setLayout({ 
                            ...layout, 
                            columns: parseInt(e.target.value) 
                          })}
                          className="slider"
                        />
                      </div>
                      
                      <div className="control-group">
                        <label>Rows: {layout.rows}</label>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          value={layout.rows}
                          onChange={(e) => setLayout({ 
                            ...layout, 
                            rows: parseInt(e.target.value) 
                          })}
                          className="slider"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'themes' && (
                <div className="tab-pane">
                  <div className="section">
                    <h3>Theme Presets</h3>
                    <div className="theme-grid">
                      {themePresets.map((preset) => (
                        <button
                          key={preset.name}
                          className={`theme-btn ${theme.name === preset.name ? 'active' : ''}`}
                          onClick={() => {
                            document.documentElement.setAttribute('data-theme', preset.type)
                          }}
                        >
                          <div className={`theme-preview ${preset.type}`}></div>
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="section">
                    <h3>Opacity Control</h3>
                    <div className="opacity-control">
                      <div className="control-group">
                        <label>Master Opacity: {Math.round(opacity * 100)}%</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={opacity}
                          onChange={(e) => setOpacity(parseFloat(e.target.value))}
                          className="slider opacity-slider"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="tab-pane">
                  <div className="section">
                    <h3>Application Settings</h3>
                    <div className="settings-list">
                      <div className="setting-item">
                        <label>Auto-arrange terminals</label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      
                      <div className="setting-item">
                        <label>Show status bar</label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      
                      <div className="setting-item">
                        <label>Enable attention system</label>
                        <input type="checkbox" defaultChecked />
                      </div>
                      
                      <div className="setting-item">
                        <label>Flash count for attention</label>
                        <input type="number" min="1" max="10" defaultValue="3" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="section">
                    <h3>Keyboard Shortcuts</h3>
                    <div className="shortcuts-list">
                      <div className="shortcut-item">
                        <span>New Terminal</span>
                        <kbd>Ctrl+N</kbd>
                      </div>
                      <div className="shortcut-item">
                        <span>Toggle Panel</span>
                        <kbd>Ctrl+P</kbd>
                      </div>
                      <div className="shortcut-item">
                        <span>Close Terminal</span>
                        <kbd>Ctrl+W</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
      
      {/* CLAUDE.md Editor */}
      <ClaudeMdEditor
        workingDir={selectedDirectory}
        isOpen={showClaudeMdEditor}
        onClose={() => setShowClaudeMdEditor(false)}
      />
    </AnimatePresence>
  )
}

export default ControlPanel