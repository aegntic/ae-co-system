import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MermaidRendererProps {
  diagram: string;
  className?: string;
  interactive?: boolean;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ 
  diagram, 
  className = '', 
  interactive = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamically import mermaid
        const mermaid = await import('mermaid');
        
        // Configure mermaid
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#FFD700',
            primaryTextColor: '#000',
            primaryBorderColor: '#FFA500',
            lineColor: '#FFD700',
            secondaryColor: '#FFC107',
            tertiaryColor: '#FFA500',
            background: '#0d1117',
            mainBkg: '#161b22',
            secondBkg: '#21262d',
            tertiaryBkg: '#30363d',
            primaryBorderColor: '#FFD700',
            secondaryBorderColor: '#FFC107',
            tertiaryBorderColor: '#FFA500',
            primaryTextColor: '#c9d1d9',
            secondaryTextColor: '#8b949e',
            tertiaryTextColor: '#656d76',
            lineColor: '#FFD700',
            textColor: '#c9d1d9',
            mainContrastColor: '#c9d1d9',
            darkMode: true,
            fontFamily: '"JetBrains Mono", "SF Mono", Monaco, monospace',
            fontSize: '14px',
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 20,
          },
          securityLevel: 'loose',
        });

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const element = document.createElement('div');
        element.id = id;
        element.textContent = diagram;
        containerRef.current.appendChild(element);

        // Render the diagram
        await mermaid.default.run({
          querySelector: `#${id}`,
        });

        // Add interactive features
        if (interactive) {
          const svg = containerRef.current.querySelector('svg');
          if (svg) {
            // Make SVG responsive
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', 'auto');
            svg.style.maxWidth = '100%';
            
            // Add hover effects to nodes
            const nodes = svg.querySelectorAll('.node');
            nodes.forEach(node => {
              node.classList.add('cursor-pointer', 'transition-all', 'duration-200');
              node.addEventListener('mouseenter', () => {
                node.style.transform = 'scale(1.05)';
                node.style.filter = 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))';
              });
              node.addEventListener('mouseleave', () => {
                node.style.transform = 'scale(1)';
                node.style.filter = '';
              });
            });

            // Add glow to edges on hover
            const edges = svg.querySelectorAll('.edgePath');
            edges.forEach(edge => {
              edge.classList.add('transition-all', 'duration-200');
              edge.addEventListener('mouseenter', () => {
                edge.style.filter = 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))';
              });
              edge.addEventListener('mouseleave', () => {
                edge.style.filter = '';
              });
            });
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [diagram, interactive]);

  if (error) {
    return (
      <div className={`p-8 bg-gh-bg-secondary rounded-lg border border-gh-border-default ${className}`}>
        <p className="text-error text-center">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gh-bg-secondary rounded-lg">
          <div className="text-wu-gold animate-pulse">Rendering diagram...</div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className={`mermaid-container ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}
        style={{
          backgroundColor: '#0d1117',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #30363d',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      />

      {/* Interactive hint */}
      {interactive && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-4 right-4 text-xs text-gh-text-muted bg-gh-bg-tertiary px-3 py-1 rounded-full"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-wu-gold rounded-full animate-pulse" />
            Interactive diagram
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};