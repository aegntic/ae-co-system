import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import * as monaco from 'monaco-editor';
import { TauriApi } from '../services/tauriApi';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Eye, 
  Settings, 
  FileCode,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  Download,
  Upload
} from 'lucide-react';

interface ClaudeMdEditorProps {
  workingDir: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
}

const CLAUDE_MD_TEMPLATES: Template[] = [
  {
    id: 'basic',
    name: 'Basic Project',
    description: 'Simple CLAUDE.md template for general projects',
    tags: ['basic', 'general'],
    content: `# Project Instructions for Claude Code

## Project Overview
Brief description of your project and its goals.

## Development Environment
- **Language**: [e.g., TypeScript, Python, Rust]
- **Framework**: [e.g., React, FastAPI, Tauri]
- **Package Manager**: [e.g., bun, npm, uv]

## Key Commands
\`\`\`bash
# Development
npm run dev

# Build
npm run build

# Test
npm test
\`\`\`

## Code Style Guidelines
- Follow existing patterns in the codebase
- Use consistent naming conventions
- Add comments for complex logic

## Important Notes
- Always test changes before committing
- Follow the existing project structure
- Check for TypeScript errors before pushing
`
  },
  {
    id: 'tauri',
    name: 'Tauri Application',
    description: 'Template for Tauri desktop applications',
    tags: ['tauri', 'desktop', 'rust', 'typescript'],
    content: `# CLAUDE.md - Tauri Application

## Project Overview
This is a Tauri desktop application combining Rust backend with modern web frontend.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + Tauri
- **Package Manager**: bun (preferred over npm)

## Development Commands
\`\`\`bash
# Install dependencies
bun install

# Start development (frontend only)
bun run dev

# Start Tauri development (full app)
bun run tauri dev

# Build for production
bun run tauri build

# Rust tests
cargo test

# Frontend tests
bun test
\`\`\`

## Project Structure
\`\`\`
src/                 # Frontend React code
src-tauri/          # Rust backend code
  src/lib.rs        # Main Tauri entry point
  src/commands.rs   # Tauri command handlers
  Cargo.toml        # Rust dependencies
public/             # Static assets
\`\`\`

## Development Guidelines
- Use Tauri commands for all frontend-backend communication
- Follow Rust error handling patterns with Result<T, E>
- Implement proper TypeScript interfaces for Tauri commands
- Use Zustand for frontend state management
- Test both frontend and backend functionality

## Performance Targets
- App startup: < 3 seconds
- Memory usage: < 200MB
- CPU usage (idle): < 5%

## Security Considerations
- Validate all inputs in Tauri commands
- Use proper file system permissions
- Sanitize any user-provided paths
`
  },
  {
    id: 'python-ai',
    name: 'Python AI Project',
    description: 'Template for Python AI/ML projects with modern tooling',
    tags: ['python', 'ai', 'ml', 'uv'],
    content: `# CLAUDE.md - Python AI Project

## Project Overview
AI/ML project using modern Python tooling and best practices.

## Technology Stack
- **Language**: Python 3.12+
- **Package Manager**: uv (ultra-fast Python package manager)
- **ML Framework**: [e.g., PyTorch, TensorFlow, scikit-learn]
- **API Framework**: FastAPI
- **Testing**: pytest

## Development Commands
\`\`\`bash
# Install dependencies (use uv instead of pip)
uv sync

# Run main application
uv run python main.py

# Start API server
uv run uvicorn main:app --reload

# Run tests
uv run pytest

# Code formatting and linting
uv run ruff check --fix
uv run ruff format

# Type checking
uv run mypy .

# Install new package
uv add package-name

# Install dev dependency
uv add --dev package-name
\`\`\`

## Project Structure
\`\`\`
src/                 # Source code
  models/           # ML models
  api/              # FastAPI routes
  utils/            # Utility functions
tests/              # Test files
data/               # Training/test data
notebooks/          # Jupyter notebooks
pyproject.toml      # Project configuration
uv.lock            # Dependency lock file
\`\`\`

## AI Model Guidelines
- Use versioned model artifacts
- Implement proper model validation
- Add comprehensive logging for training/inference
- Document model architecture and hyperparameters
- Include model performance metrics

## Performance Requirements
- Model inference: < 100ms per request
- API response time: < 200ms
- Memory efficiency for large datasets
- GPU utilization optimization

## Data Handling
- Validate all input data formats
- Implement proper data preprocessing pipelines
- Use efficient data loading (avoid memory leaks)
- Follow data privacy and security best practices
`
  },
  {
    id: 'web-app',
    name: 'Modern Web Application',
    description: 'Template for modern web applications with TypeScript',
    tags: ['web', 'react', 'typescript', 'next'],
    content: `# CLAUDE.md - Modern Web Application

## Project Overview
Full-stack web application with modern tooling and best practices.

## Technology Stack
- **Frontend**: React 18 + TypeScript
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Package Manager**: bun
- **Database**: [e.g., PostgreSQL, Prisma]

## Development Commands
\`\`\`bash
# Install dependencies
bun install

# Development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linting
bun run lint

# Run tests
bun test

# Database migrations (if using Prisma)
bunx prisma migrate dev
\`\`\`

## Project Structure
\`\`\`
app/                 # Next.js App Router
  (routes)/         # Route groups
  api/              # API routes
  globals.css       # Global styles
components/         # Reusable React components
  ui/               # Base UI components
  forms/            # Form components
  layout/           # Layout components
lib/                # Utility libraries
  utils.ts          # Helper functions
  api.ts            # API client
  types.ts          # TypeScript types
public/             # Static assets
\`\`\`

## Code Guidelines
- Use Server Components by default, Client Components when needed
- Implement proper error boundaries
- Follow Next.js App Router patterns
- Use TypeScript strictly (no \`any\` types)
- Implement responsive design with Tailwind
- Use proper SEO meta tags

## Performance Targets
- Core Web Vitals: Green scores
- First Contentful Paint: < 1.2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

## API Guidelines
- Use proper HTTP status codes
- Implement request validation
- Add rate limiting for public endpoints
- Use proper error handling and logging
- Document API endpoints
`
  },
  {
    id: 'rust-systems',
    name: 'Rust Systems Project',
    description: 'Template for Rust systems programming projects',
    tags: ['rust', 'systems', 'performance'],
    content: `# CLAUDE.md - Rust Systems Project

## Project Overview
High-performance systems programming project built with Rust.

## Technology Stack
- **Language**: Rust (latest stable)
- **Build System**: Cargo
- **Testing**: Built-in Rust testing + criterion for benchmarks
- **Documentation**: rustdoc

## Development Commands
\`\`\`bash
# Build project
cargo build

# Build with optimizations
cargo build --release

# Run project
cargo run

# Run with release optimizations
cargo run --release

# Run tests
cargo test

# Run benchmarks
cargo bench

# Check code without building
cargo check

# Format code
cargo fmt

# Lint code
cargo clippy -- -D warnings

# Generate documentation
cargo doc --open
\`\`\`

## Project Structure
\`\`\`
src/
  lib.rs            # Library root
  main.rs           # Binary entry point
  modules/          # Core modules
  utils/            # Utility functions
tests/              # Integration tests
benches/            # Benchmark tests
examples/           # Usage examples
Cargo.toml          # Project manifest
Cargo.lock          # Dependency lock file
\`\`\`

## Performance Guidelines
- Use \`cargo bench\` for performance validation
- Profile with \`perf\` or \`valgrind\` when needed
- Minimize allocations in hot paths
- Use appropriate data structures for the use case
- Consider \`no_std\` when applicable

## Safety Guidelines
- Minimize \`unsafe\` code usage
- Document all \`unsafe\` blocks with safety invariants
- Use \`clippy\` to catch common pitfalls
- Implement comprehensive error handling
- Use proper lifetime annotations

## Testing Strategy
- Unit tests for individual functions
- Integration tests for module interactions
- Property-based testing for complex logic
- Benchmark tests for performance-critical code
- Fuzz testing for input validation
`
  }
];

export default function ClaudeMdEditor({ workingDir, isOpen, onClose }: ClaudeMdEditorProps) {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'none' | 'saving' | 'saved' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const editorRef = useRef<any>(null);

  // Load CLAUDE.md content when component opens
  useEffect(() => {
    if (isOpen && workingDir) {
      loadClaudeMdContent();
    }
  }, [isOpen, workingDir]);

  // Track changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadClaudeMdContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await TauriApi.getClaudeMdContent(workingDir);
      const loadedContent = result || '';
      setContent(loadedContent);
      setOriginalContent(loadedContent);
      
      // If no content exists, show templates
      if (!loadedContent.trim()) {
        setShowTemplates(true);
      }
    } catch (err) {
      setError(`Failed to load CLAUDE.md: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    setSaveStatus('saving');
    setError(null);

    try {
      await TauriApi.saveClaudeMdContent(workingDir, content);
      setOriginalContent(content);
      setSaveStatus('saved');
      
      // Reset save status after 2 seconds
      setTimeout(() => setSaveStatus('none'), 2000);
    } catch (err) {
      setError(`Failed to save CLAUDE.md: ${err}`);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetContent = () => {
    setContent(originalContent);
  };

  const applyTemplate = (template: Template) => {
    setContent(template.content);
    setSelectedTemplate(template);
    setShowTemplates(false);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure Monaco for markdown
    editor.getModel()?.updateOptions({
      tabSize: 2,
      insertSpaces: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveContent();
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const exportToFile = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CLAUDE.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="popup-backdrop">
      <motion.div
        className="popup-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{ width: '90vw', height: '85vh' }}
      >
        {/* Header */}
        <div className="popup-header">
          <div className="popup-title">
            <h2>
              <FileText size={18} style={{ marginRight: '8px', display: 'inline' }} />
              CLAUDE.md Editor
            </h2>
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '4px'
            }}>
              {workingDir}
            </div>
          </div>
          
          <div className="popup-actions">
            {/* Template Button */}
            <button
              className="action-btn"
              onClick={() => setShowTemplates(!showTemplates)}
              title="Templates"
            >
              <FileCode size={14} />
              Templates
            </button>

            {/* Preview Button */}
            <button
              className="action-btn"
              onClick={() => setShowPreview(!showPreview)}
              title="Toggle Preview"
            >
              <Eye size={14} />
              Preview
            </button>

            {/* Copy Button */}
            <button
              className="action-btn"
              onClick={copyToClipboard}
              title="Copy to Clipboard"
            >
              <Copy size={14} />
            </button>

            {/* Export Button */}
            <button
              className="action-btn"
              onClick={exportToFile}
              title="Export File"
            >
              <Download size={14} />
            </button>

            {/* Reset Button */}
            <button
              className="action-btn"
              onClick={resetContent}
              disabled={!hasChanges}
              title="Reset Changes"
            >
              <RotateCcw size={14} />
            </button>

            {/* Save Button */}
            <button
              className={`action-btn ${hasChanges ? 'success' : ''}`}
              onClick={saveContent}
              disabled={!hasChanges || isSaving}
              title="Save (Ctrl+S)"
            >
              {isSaving ? (
                <RefreshCw size={14} className="spinning" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle size={14} />
              ) : saveStatus === 'error' ? (
                <AlertCircle size={14} />
              ) : (
                <Save size={14} />
              )}
              {isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
            </button>

            {/* Close Button */}
            <button
              className="action-btn close"
              onClick={onClose}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button 
              className="error-close"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="popup-content" style={{ padding: 0, display: 'flex' }}>
          {/* Templates Sidebar */}
          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '300px', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                style={{
                  background: 'rgba(var(--panel-bg), 0.9)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
                    Templates
                  </h3>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '11px', 
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    Choose a template to get started
                  </p>
                </div>
                
                <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                  {CLAUDE_MD_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${
                          selectedTemplate?.id === template.id 
                            ? 'rgba(0, 122, 255, 0.5)' 
                            : 'rgba(255, 255, 255, 0.1)'
                        }`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 'bold',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '4px'
                      }}>
                        {template.name}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '8px'
                      }}>
                        {template.description}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '10px',
                              color: 'rgba(255, 255, 255, 0.7)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor/Preview Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {showPreview ? (
              // Preview Mode
              <div style={{ 
                flex: 1, 
                padding: '20px', 
                overflow: 'auto',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div 
                  style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: content
                      // Simple markdown-to-HTML conversion for preview
                      .replace(/^# (.*$)/gim, '<h1 style="color: rgba(255, 255, 255, 0.95); margin-bottom: 16px;">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 style="color: rgba(255, 255, 255, 0.9); margin-bottom: 12px;">$1</h2>')
                      .replace(/^### (.*$)/gim, '<h3 style="color: rgba(255, 255, 255, 0.85); margin-bottom: 8px;">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code style="background: rgba(255, 255, 255, 0.1); padding: 2px 4px; border-radius: 3px;">$1</code>')
                      .replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 12px 0;"><code>$1</code></pre>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            ) : (
              // Editor Mode
              <div style={{ flex: 1, position: 'relative' }}>
                {isLoading ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    <RefreshCw size={24} className="spinning" style={{ marginRight: '8px' }} />
                    Loading CLAUDE.md...
                  </div>
                ) : (
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      lineHeight: 22,
                      wordWrap: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                      renderWhitespace: 'boundary',
                      guides: {
                        indentation: true,
                        highlightActiveIndentation: true,
                      },
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="popup-footer">
          <div className="popup-meta">
            <span>Lines: {content.split('\n').length}</span>
            <span>Characters: {content.length}</span>
            {hasChanges && <span style={{ color: 'rgb(255, 149, 0)' }}>• Unsaved changes</span>}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
            Press Ctrl+S to save • Templates available in sidebar
          </div>
        </div>
      </motion.div>
    </div>
  );
}