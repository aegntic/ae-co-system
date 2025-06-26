import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, Download, CheckCircle } from 'lucide-react'
import { Terminal } from '../store/terminalStore'
import useTerminalStore from '../store/terminalStore'

interface PopupCardProps {
  terminal: Terminal
}

const PopupCard: React.FC<PopupCardProps> = ({ terminal }) => {
  const outputRef = useRef<HTMLDivElement>(null)
  const { hidePopup, updateTerminal } = useTerminalStore()
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [terminal.output])
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hidePopup(terminal.id)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [terminal.id, hidePopup])
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      hidePopup(terminal.id)
    }
  }
  
  const handleCopyAll = () => {
    const allOutput = terminal.output.join('\n')
    navigator.clipboard.writeText(allOutput)
  }
  
  const handleSaveSnippet = () => {
    const snippet = terminal.output.slice(-10).join('\n') // Last 10 lines
    const blob = new Blob([snippet], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-code-snippet-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleMarkResolved = () => {
    updateTerminal(terminal.id, { 
      needsAttention: false,
      status: 'completed' 
    })
    hidePopup(terminal.id)
  }

  return (
    <motion.div
      className="popup-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        className="popup-card"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="popup-header">
          <div className="popup-title">
            <h2>{terminal.title}</h2>
            <span className="popup-status">{terminal.status}</span>
          </div>
          
          <div className="popup-actions">
            <button 
              onClick={handleCopyAll}
              className="action-btn"
              title="Copy all output"
            >
              <Copy className="w-4 h-4" />
              Copy All
            </button>
            
            <button 
              onClick={handleSaveSnippet}
              className="action-btn"
              title="Save conversation snippet"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
            
            <button 
              onClick={handleMarkResolved}
              className="action-btn success"
              title="Mark as resolved"
            >
              <CheckCircle className="w-4 h-4" />
              Resolve
            </button>
            
            <button 
              onClick={() => hidePopup(terminal.id)}
              className="action-btn close"
              title="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Enhanced Content with Better Typography */}
        <div 
          ref={outputRef}
          className="popup-content"
        >
          {terminal.output.map((line, index) => (
            <div key={index} className="popup-line">
              <span className="popup-line-number">{index + 1}</span>
              <span className="popup-line-content">{line}</span>
            </div>
          ))}
          
          {terminal.status === 'waiting' && (
            <div className="popup-line waiting">
              <span className="popup-line-number">{'>'}</span>
              <span className="popup-line-content">
                Waiting for input...
                <span className="animate-pulse ml-2">█</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Enhanced Footer */}
        <div className="popup-footer">
          <div className="popup-meta">
            <span>Directory: {terminal.workingDir}</span>
            <span>PID: {terminal.pid || 'N/A'}</span>
            <span>Lines: {terminal.output.length}</span>
          </div>
          
          <div className="popup-help">
            <span className="help-text">Press ESC to close</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PopupCard