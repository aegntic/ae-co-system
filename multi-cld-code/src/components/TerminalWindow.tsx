import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal as TerminalIcon, X, Maximize2, Copy, Send } from 'lucide-react'
import { Terminal } from '../store/terminalStore'
import useTerminalStore from '../store/terminalStore'
import TerminalInput from './TerminalInput'

interface TerminalWindowProps {
  terminal: Terminal
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ terminal }) => {
  const outputRef = useRef<HTMLDivElement>(null)
  const [showInput, setShowInput] = useState(false)
  const { updateTerminal, removeTerminal, showPopup, toggleAttention } = useTerminalStore()
  
  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [terminal.output])
  
  // Flash animation for attention
  const borderClass = terminal.needsAttention 
    ? 'border-attention border-4 animate-flash' 
    : 'border-gray-700 border'
    
  const statusColor = {
    running: 'text-green-400',
    waiting: 'text-yellow-400', 
    idle: 'text-gray-400',
    error: 'text-red-400',
    completed: 'text-blue-400'
  }[terminal.status]
  
  const handleTerminalClick = () => {
    if (terminal.needsAttention) {
      showPopup(terminal.id)
      toggleAttention(terminal.id, false)
    }
  }
  
  const handleCopyOutput = () => {
    const lastOutput = terminal.output[terminal.output.length - 1]
    if (lastOutput) {
      navigator.clipboard.writeText(lastOutput)
    }
  }

  return (
    <motion.div
      className={`terminal-window ${borderClass}`}
      style={{
        position: 'absolute',
        left: terminal.position.x,
        top: terminal.position.y,
        width: terminal.position.width,
        height: terminal.position.height,
        opacity: terminal.opacity,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: terminal.opacity }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleTerminalClick}
      whileHover={{ scale: 1.02 }}
    >
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-title">
          <TerminalIcon className="w-4 h-4" />
          <span className="truncate">{terminal.title}</span>
          <span className={`status-dot ${statusColor}`}>●</span>
        </div>
        
        <div className="terminal-controls">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleCopyOutput()
            }}
            className="control-btn"
            title="Copy last output"
          >
            <Copy className="w-3 h-3" />
          </button>
          
          {terminal.needsAttention && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowInput(true)
              }}
              className="control-btn text-yellow-400 hover:text-yellow-300"
              title="Send input"
            >
              <Send className="w-3 h-3" />
            </button>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation()
              showPopup(terminal.id)
            }}
            className="control-btn"
            title="Expand terminal"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation()
              removeTerminal(terminal.id)
            }}
            className="control-btn text-red-400 hover:text-red-300"
            title="Close terminal"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Terminal Content */}
      <div 
        ref={outputRef}
        className="terminal-content"
      >
        {terminal.output.map((line, index) => (
          <div key={index} className="terminal-line">
            <span className="line-number">{index + 1}</span>
            <span className="line-content">{line}</span>
          </div>
        ))}
        
        {terminal.status === 'waiting' && (
          <div className="terminal-line waiting">
            <span className="line-number">{'>'}</span>
            <span className="line-content cursor">
              <span className="animate-pulse">█</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Working Directory Indicator */}
      <div className="terminal-footer">
        <span className="working-dir">{terminal.workingDir}</span>
        <span className="pid">{terminal.pid ? `PID: ${terminal.pid}` : 'Not running'}</span>
      </div>
      
      {/* Terminal Input Modal */}
      <TerminalInput 
        terminalId={terminal.id}
        isVisible={showInput}
        onClose={() => setShowInput(false)}
      />
    </motion.div>
  )
}

export default TerminalWindow