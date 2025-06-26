import React, { useState, useRef, useEffect } from 'react'
import { Send, ArrowUp } from 'lucide-react'
import useTerminalStore from '../store/terminalStore'

interface TerminalInputProps {
  terminalId: string
  isVisible: boolean
  onClose: () => void
}

const TerminalInput: React.FC<TerminalInputProps> = ({ 
  terminalId, 
  isVisible, 
  onClose 
}) => {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const { sendInput, isLoading } = useTerminalStore()

  // Focus input when visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add to history
    const newHistory = [input, ...history.slice(0, 49)] // Keep last 50 commands
    setHistory(newHistory)
    setHistoryIndex(-1)

    // Send input to terminal
    try {
      await sendInput(terminalId, input + '\n')
      setInput('')
      onClose()
    } catch (error) {
      console.error('Failed to send input:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex] || '')
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  if (!isVisible) return null

  return (
    <div className="terminal-input-overlay">
      <div className="terminal-input-card">
        <div className="input-header">
          <h3>Terminal Input</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-container">
            <span className="prompt">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command or input..."
              className="command-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="send-btn"
            >
              {isLoading ? (
                <div className="spinner-small"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
        
        {history.length > 0 && (
          <div className="input-history">
            <div className="history-header">
              <ArrowUp className="w-3 h-3" />
              <span>Recent Commands</span>
            </div>
            <div className="history-list">
              {history.slice(0, 5).map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => setInput(cmd)}
                  className="history-item"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="input-help">
          <span>Press ↑/↓ for history, ESC to close</span>
        </div>
      </div>
    </div>
  )
}

export default TerminalInput