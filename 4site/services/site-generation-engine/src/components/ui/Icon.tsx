
import React from 'react';
import type { LucideProps } from 'lucide-react';
// Using direct imports for the icons for this environment.
import { 
  Rocket, Zap, BrainCircuit, Palette, Share2, Github, ShieldCheck, PlayCircle, LoaderCircle, Sparkles, Twitter, Linkedin, Facebook, Link as LinkIcon, ArrowLeft, ExternalLink, ListChecks, Eye, Cpu, TerminalSquare, Download, GitFork, ScrollText, FileText, Puzzle, CheckCircle2, AlertTriangle, AlertCircle, Info, X 
} from 'lucide-react';

// Explicitly type the record
const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  Rocket, Zap, BrainCircuit, Palette, Share2, Github, ShieldCheck, PlayCircle, LoaderCircle, Sparkles, Twitter, Linkedin, Facebook, Link: LinkIcon, ArrowLeft, ExternalLink, ListChecks, Eye, Cpu, TerminalSquare, Download, GitFork, ScrollText, FileText, Puzzle, CheckCircle2, AlertTriangle, AlertCircle, Info, X
};


interface IconProps extends LucideProps {
  name: keyof typeof iconComponents; // Use keyof for type safety
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIconComponent = iconComponents[name];

  if (!LucideIconComponent) {
    console.warn(`Icon "${name}" not found. Rendering default (FileText).`);
    const DefaultIconComponent = iconComponents['FileText']; // Defaulting to FileText
    if (!DefaultIconComponent) {
      // Ultimate fallback if FileText itself is missing (should not happen with direct imports)
      const { size = 24, color = "currentColor", strokeWidth = 2, ...restSvgProps } = props;
      return (
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          {...restSvgProps}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    return <DefaultIconComponent {...props} />;
  }

  return <LucideIconComponent {...props} />;
};
