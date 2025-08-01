/**
 * CodeBlock Component for Remotion
 * 
 * Displays code with syntax highlighting and animations
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface CodeBlockProps {
  code: string;
  language: string;
  style: any;
  animate?: boolean;
  highlightLines?: number[];
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  style,
  animate = true,
  highlightLines = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = code.split('\n');
  const totalChars = code.length;

  // Calculate how many characters should be visible
  const progress = animate
    ? spring({
        frame,
        fps,
        config: {
          damping: 100,
          stiffness: 100,
          mass: 0.5,
        },
      })
    : 1;

  const visibleChars = Math.floor(progress * totalChars);

  // Syntax highlighting colors
  const syntaxColors = {
    keyword: style.primaryColor || '#ff79c6',
    string: '#f1fa8c',
    comment: '#6272a4',
    function: '#50fa7b',
    number: '#bd93f9',
    operator: '#ff5555',
  };

  // Simple syntax highlighting
  const highlightSyntax = (text: string, lang: string) => {
    if (lang === 'javascript' || lang === 'typescript') {
      return text
        .replace(/\b(const|let|var|function|return|if|else|for|while)\b/g, 
          `<span style="color: ${syntaxColors.keyword}">$1</span>`)
        .replace(/'([^']*)'|"([^"]*)"/g, 
          `<span style="color: ${syntaxColors.string}">'$1$2'</span>`)
        .replace(/\/\/.*$/gm, 
          `<span style="color: ${syntaxColors.comment}">$&</span>`)
        .replace(/\b(\d+)\b/g, 
          `<span style="color: ${syntaxColors.number}">$1</span>`);
    }
    return text;
  };

  // Build visible code with animation
  let charCount = 0;
  const visibleLines = lines.map((line, lineIndex) => {
    const lineStart = charCount;
    charCount += line.length + 1; // +1 for newline

    if (animate && lineStart > visibleChars) {
      return '';
    }

    const visibleLineChars = animate
      ? Math.max(0, Math.min(line.length, visibleChars - lineStart))
      : line.length;

    const visibleLine = line.substring(0, visibleLineChars);
    const isHighlighted = highlightLines.includes(lineIndex + 1);

    return {
      text: visibleLine,
      highlighted: isHighlighted,
      opacity: interpolate(
        frame,
        [lineIndex * 2, lineIndex * 2 + 10],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      ),
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: '10%',
        top: '10%',
        width: '80%',
        height: '80%',
        backgroundColor: style.backgroundColor || '#282a36',
        borderRadius: 8,
        padding: 20,
        fontFamily: style.fontFamily || 'Fira Code, monospace',
        fontSize: style.fontSize || 16,
        color: '#f8f8f2',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Line numbers */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 20,
          width: 40,
          textAlign: 'right',
          paddingRight: 10,
          color: '#6272a4',
          fontSize: 14,
        }}
      >
        {visibleLines.map((_, index) => (
          <div key={index} style={{ opacity: visibleLines[index]?.opacity || 0 }}>
            {index + 1}
          </div>
        ))}
      </div>

      {/* Code content */}
      <div style={{ marginLeft: 50 }}>
        {visibleLines.map((line, index) => (
          <div
            key={index}
            style={{
              backgroundColor: line.highlighted ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              marginLeft: -50,
              paddingLeft: 50,
              opacity: line.opacity,
              minHeight: '1.5em',
            }}
            dangerouslySetInnerHTML={{
              __html: highlightSyntax(line.text || '', language),
            }}
          />
        ))}
        {animate && visibleChars < totalChars && (
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 20,
              backgroundColor: style.primaryColor || '#ff79c6',
              animation: 'blink 1s infinite',
            }}
          />
        )}
      </div>

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};