import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { TauriApi, Terminal as TauriTerminal, TauriUtils } from '../services/tauriApi'

// Map Tauri terminal to store terminal format
export interface Terminal {
  id: string
  pid?: number
  title: string
  workingDir: string
  status: 'starting' | 'running' | 'waiting' | 'idle' | 'error' | 'completed'
  needsAttention: boolean
  opacity: number
  output: string[]
  position: { x: number; y: number; width: number; height: number }
  isPopup: boolean
  createdAt?: Date
  lastActivity?: Date
}

export interface LayoutConfig {
  columns: number
  rows: number
  gap: number
}

export interface ThemeConfig {
  name: string
  colors: {
    background: string
    text: string
    attention: string
    panel: string
  }
  fonts: {
    family: string
    size: number
  }
}

interface TerminalState {
  terminals: Terminal[]
  layout: LayoutConfig
  theme: ThemeConfig
  opacity: number
  controlPanelVisible: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  addTerminal: (terminal: Omit<Terminal, 'id'>) => void
  removeTerminal: (id: string) => Promise<void>
  updateTerminal: (id: string, updates: Partial<Terminal>) => void
  setLayout: (layout: LayoutConfig) => void
  setTheme: (theme: ThemeConfig) => void
  setOpacity: (opacity: number) => void
  setControlPanelVisible: (visible: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Terminal Actions
  spawnClaudeCode: (workingDir: string, title?: string) => Promise<string | null>
  sendInput: (id: string, input: string) => Promise<void>
  toggleAttention: (id: string, needsAttention: boolean) => void
  showPopup: (id: string) => void
  hidePopup: (id: string) => void
  
  // Layout Actions
  arrangeInGrid: () => void
  resizeTerminal: (id: string, size: { width: number; height: number }) => Promise<void>
  moveTerminal: (id: string, position: { x: number; y: number }) => Promise<void>
  
  // Real-time updates
  refreshTerminals: () => Promise<void>
  refreshTerminal: (id: string) => Promise<void>
  
  // Project utilities
  detectProjectType: (workingDir: string) => Promise<string>
  getProjectSuggestions: (workingDir: string) => Promise<string[]>
  selectDirectory: () => Promise<string | null>
}

// Helper function to convert Tauri terminal to store terminal
const convertTauriTerminal = (tauriTerminal: TauriTerminal): Terminal => ({
  id: tauriTerminal.id,
  pid: tauriTerminal.pid,
  title: tauriTerminal.title,
  workingDir: tauriTerminal.working_dir,
  status: tauriTerminal.status.toLowerCase() as Terminal['status'],
  needsAttention: tauriTerminal.needs_attention,
  opacity: tauriTerminal.opacity,
  output: tauriTerminal.output_buffer,
  position: {
    x: tauriTerminal.position.x,
    y: tauriTerminal.position.y,
    width: tauriTerminal.position.width,
    height: tauriTerminal.position.height,
  },
  isPopup: tauriTerminal.is_popup,
  createdAt: TauriUtils.parseDateTime(tauriTerminal.created_at),
  lastActivity: TauriUtils.parseDateTime(tauriTerminal.last_activity),
})

const defaultTheme: ThemeConfig = {
  name: 'Default',
  colors: {
    background: 'rgb(12, 12, 12)',
    text: 'rgb(255, 255, 255)',
    attention: 'rgb(255, 59, 48)',
    panel: 'rgb(28, 28, 30)',
  },
  fonts: {
    family: 'Monaco, Menlo, Ubuntu Mono, monospace',
    size: 14,
  },
}

const useTerminalStore = create<TerminalState>()(
  subscribeWithSelector((set, get) => ({
    terminals: [],
    layout: { columns: 2, rows: 2, gap: 8 },
    theme: defaultTheme,
    opacity: 1,
    controlPanelVisible: false,
    isLoading: false,
    error: null,
    
    // Basic state management
    addTerminal: (terminal) => {
      const id = crypto.randomUUID()
      const newTerminal: Terminal = {
        ...terminal,
        id,
        opacity: 1,
        isPopup: false,
        position: { x: 0, y: 0, width: 400, height: 300 },
      }
      
      set((state) => ({
        terminals: [...state.terminals, newTerminal]
      }))
      
      get().arrangeInGrid()
    },
    
    removeTerminal: async (id) => {
      try {
        get().setLoading(true)
        await TauriApi.terminateTerminal(id)
        
        set((state) => ({
          terminals: state.terminals.filter(t => t.id !== id)
        }))
        
        get().arrangeInGrid()
      } catch (error) {
        get().setError(`Failed to remove terminal: ${error}`)
      } finally {
        get().setLoading(false)
      }
    },
    
    updateTerminal: (id, updates) => {
      set((state) => ({
        terminals: state.terminals.map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      }))
    },
    
    setLayout: (layout) => {
      set({ layout })
      get().arrangeInGrid()
    },
    
    setTheme: (theme) => set({ theme }),
    setOpacity: (opacity) => set({ opacity }),
    setControlPanelVisible: (visible) => set({ controlPanelVisible: visible }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    
    // Real terminal management with Tauri
    spawnClaudeCode: async (workingDir: string, title?: string) => {
      try {
        get().setLoading(true)
        get().setError(null)
        
        const terminalId = await TauriApi.spawnClaudeCode({
          working_dir: workingDir,
          title,
        })
        
        // Refresh terminals to get the new one
        await get().refreshTerminals()
        get().arrangeInGrid()
        
        return terminalId
      } catch (error) {
        const errorMessage = `Failed to spawn Claude Code: ${error}`
        get().setError(errorMessage)
        console.error(errorMessage)
        return null
      } finally {
        get().setLoading(false)
      }
    },
    
    sendInput: async (id: string, input: string) => {
      try {
        await TauriApi.sendTerminalInput({
          terminal_id: id,
          input,
        })
        
        // Refresh the specific terminal to get updated status
        await get().refreshTerminal(id)
      } catch (error) {
        get().setError(`Failed to send input: ${error}`)
      }
    },
    
    toggleAttention: (id, needsAttention) => {
      get().updateTerminal(id, { needsAttention })
    },
    
    showPopup: (id) => {
      get().updateTerminal(id, { isPopup: true })
    },
    
    hidePopup: (id) => {
      get().updateTerminal(id, { isPopup: false })
    },
    
    // Layout management
    arrangeInGrid: () => {
      const { terminals, layout } = get()
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight - 50
      
      const terminalWidth = (screenWidth - (layout.columns + 1) * layout.gap) / layout.columns
      const terminalHeight = (screenHeight - (layout.rows + 1) * layout.gap) / layout.rows
      
      const updatedTerminals = terminals.map((terminal, index) => {
        if (terminal.isPopup) return terminal
        
        const col = index % layout.columns
        const row = Math.floor(index / layout.columns)
        
        return {
          ...terminal,
          position: {
            x: layout.gap + col * (terminalWidth + layout.gap),
            y: layout.gap + row * (terminalHeight + layout.gap),
            width: terminalWidth,
            height: terminalHeight,
          }
        }
      })
      
      set({ terminals: updatedTerminals })
    },
    
    resizeTerminal: async (id: string, size: { width: number; height: number }) => {
      const terminal = get().terminals.find(t => t.id === id)
      if (!terminal) return
      
      const newPosition = { ...terminal.position, ...size }
      
      try {
        await TauriApi.updateTerminalPosition({
          terminal_id: id,
          position: newPosition,
        })
        
        get().updateTerminal(id, { position: newPosition })
      } catch (error) {
        get().setError(`Failed to resize terminal: ${error}`)
      }
    },
    
    moveTerminal: async (id: string, position: { x: number; y: number }) => {
      const terminal = get().terminals.find(t => t.id === id)
      if (!terminal) return
      
      const newPosition = { ...terminal.position, ...position }
      
      try {
        await TauriApi.updateTerminalPosition({
          terminal_id: id,
          position: newPosition,
        })
        
        get().updateTerminal(id, { position: newPosition })
      } catch (error) {
        get().setError(`Failed to move terminal: ${error}`)
      }
    },
    
    // Real-time updates
    refreshTerminals: async () => {
      try {
        const tauriTerminals = await TauriApi.getAllTerminals()
        const terminals = tauriTerminals.map(convertTauriTerminal)
        
        set({ terminals })
      } catch (error) {
        get().setError(`Failed to refresh terminals: ${error}`)
      }
    },
    
    refreshTerminal: async (id: string) => {
      try {
        const tauriTerminal = await TauriApi.getTerminal(id)
        if (tauriTerminal) {
          const terminal = convertTauriTerminal(tauriTerminal)
          get().updateTerminal(id, terminal)
        }
      } catch (error) {
        get().setError(`Failed to refresh terminal ${id}: ${error}`)
      }
    },
    
    // Project utilities
    detectProjectType: async (workingDir: string) => {
      try {
        return await TauriApi.detectProjectType(workingDir)
      } catch (error) {
        console.error('Failed to detect project type:', error)
        return 'unknown'
      }
    },
    
    getProjectSuggestions: async (workingDir: string) => {
      try {
        return await TauriApi.getProjectSuggestions(workingDir)
      } catch (error) {
        console.error('Failed to get project suggestions:', error)
        return []
      }
    },
    
    selectDirectory: async () => {
      try {
        return await TauriApi.selectDirectory()
      } catch (error) {
        get().setError(`Failed to select directory: ${error}`)
        return null
      }
    },
  }))
)

// Auto-arrange when window resizes
window.addEventListener('resize', () => {
  useTerminalStore.getState().arrangeInGrid()
})

export default useTerminalStore