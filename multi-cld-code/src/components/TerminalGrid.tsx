import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TerminalWindow from './TerminalWindow'
import PopupCard from './PopupCard'
import useTerminalStore from '../store/terminalStore'

const TerminalGrid: React.FC = () => {
  const { terminals } = useTerminalStore()
  
  const gridTerminals = terminals.filter(t => !t.isPopup)
  const popupTerminals = terminals.filter(t => t.isPopup)

  return (
    <>
      {/* Grid Layout Terminals */}
      <div className="terminal-grid">
        <AnimatePresence mode="wait">
          {gridTerminals.map((terminal) => (
            <TerminalWindow
              key={terminal.id}
              terminal={terminal}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Popup Cards */}
      <AnimatePresence>
        {popupTerminals.map((terminal) => (
          <PopupCard
            key={terminal.id}
            terminal={terminal}
          />
        ))}
      </AnimatePresence>
    </>
  )
}

export default TerminalGrid