import { invoke } from '@tauri-apps/api/core'

export interface TerminalPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface Terminal {
  id: string
  pid?: number
  title: string
  working_dir: string
  status: 'Starting' | 'Running' | 'Waiting' | 'Idle' | 'Error' | 'Completed'
  needs_attention: boolean
  opacity: number
  output_buffer: string[]
  position: TerminalPosition
  is_popup: boolean
  created_at: string
  last_activity: string
}

export interface SpawnTerminalRequest {
  working_dir: string
  title?: string
}

export interface SendInputRequest {
  terminal_id: string
  input: string
}

export interface UpdatePositionRequest {
  terminal_id: string
  position: TerminalPosition
}

export interface SetOpacityRequest {
  terminal_id: string
  opacity: number
}

export class TauriApi {
  // Terminal Management
  static async spawnClaudeCode(request: SpawnTerminalRequest): Promise<string> {
    return await invoke('spawn_claude_code', { request })
  }

  static async getTerminal(terminalId: string): Promise<Terminal | null> {
    return await invoke('get_terminal', { terminalId })
  }

  static async getAllTerminals(): Promise<Terminal[]> {
    return await invoke('get_all_terminals')
  }

  static async sendTerminalInput(request: SendInputRequest): Promise<void> {
    return await invoke('send_terminal_input', { request })
  }

  static async terminateTerminal(terminalId: string): Promise<void> {
    return await invoke('terminate_terminal', { terminalId })
  }

  static async updateTerminalPosition(request: UpdatePositionRequest): Promise<void> {
    return await invoke('update_terminal_position', { request })
  }

  static async setTerminalOpacity(request: SetOpacityRequest): Promise<void> {
    return await invoke('set_terminal_opacity', { request })
  }

  static async getTerminalCount(): Promise<number> {
    return await invoke('get_terminal_count')
  }

  static async getActiveTerminals(): Promise<Terminal[]> {
    return await invoke('get_active_terminals')
  }

  // Project Detection
  static async detectProjectType(workingDir: string): Promise<string> {
    return await invoke('detect_project_type', { workingDir })
  }

  static async getProjectSuggestions(workingDir: string): Promise<string[]> {
    return await invoke('get_project_suggestions', { workingDir })
  }

  static async selectDirectory(): Promise<string | null> {
    return await invoke('select_directory')
  }

  // CLAUDE.md Management
  static async getClaudeMdContent(workingDir: string): Promise<string | null> {
    return await invoke('get_claude_md_content', { workingDir })
  }

  static async saveClaudeMdContent(workingDir: string, content: string): Promise<void> {
    return await invoke('save_claude_md_content', { workingDir, content })
  }
}

// Event listening utilities
export class TauriEventManager {
  private static listeners: Map<string, Set<(data: any) => void>> = new Map()

  static addListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  static removeListener(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
      if (listeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  static emit(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }
}

// Error handling wrapper
export async function safeInvoke<T>(
  command: string,
  args?: Record<string, any>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await invoke<T>(command, args)
    return { success: true, data }
  } catch (error) {
    console.error(`Tauri command ${command} failed:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Utility functions for common operations
export const TauriUtils = {
  // Format terminal status for display
  formatStatus(status: Terminal['status']): { text: string; color: string } {
    const statusMap = {
      Starting: { text: 'Starting...', color: 'text-blue-400' },
      Running: { text: 'Running', color: 'text-green-400' },
      Waiting: { text: 'Waiting for Input', color: 'text-yellow-400' },
      Idle: { text: 'Idle', color: 'text-gray-400' },
      Error: { text: 'Error', color: 'text-red-400' },
      Completed: { text: 'Completed', color: 'text-blue-400' },
    }
    return statusMap[status] || { text: status, color: 'text-gray-400' }
  },

  // Convert Rust DateTime to JavaScript Date
  parseDateTime(dateTimeStr: string): Date {
    return new Date(dateTimeStr)
  },

  // Format file path for display
  formatPath(path: string): string {
    if (path.length > 50) {
      const parts = path.split('/')
      if (parts.length > 3) {
        return `.../${parts.slice(-2).join('/')}`
      }
    }
    return path
  },

  // Generate terminal title based on project type
  generateTitle(workingDir: string, projectType?: string): string {
    const dirName = workingDir.split('/').pop() || 'Unknown'
    const prefix = projectType ? `${projectType.toUpperCase()} - ` : ''
    return `${prefix}Claude Code - ${dirName}`
  },

  // Check if terminal needs attention based on output
  checkForAttention(output: string[]): boolean {
    const attentionPatterns = [
      /please provide|enter your choice|select an option/i,
      /waiting for input|user input required/i,
      /\?\s*$|:\s*$/,
      /\[y\/n\]|\[yes\/no\]/i,
      /continue\?|proceed\?/i,
    ]

    const lastLines = output.slice(-3).join(' ')
    return attentionPatterns.some(pattern => pattern.test(lastLines))
  },

  // Validate directory path
  isValidDirectory(path: string): boolean {
    return path.length > 0 && !path.includes('..') && path.startsWith('/')
  },
}