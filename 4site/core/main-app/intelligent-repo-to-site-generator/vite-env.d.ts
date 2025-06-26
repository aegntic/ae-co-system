/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_GITHUB_TOKEN?: string
  readonly VITE_FAL_API_KEY?: string
  readonly VITE_AURA_API_KEY?: string
  readonly VITE_MCP_SERVER_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}