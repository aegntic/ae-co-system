import React from 'react';
import type { LucideProps } from 'lucide-react';
// Using direct imports for the icons for this environment.
import { 
  Rocket, Zap, BrainCircuit, Palette, Share2, Github, ShieldCheck, PlayCircle, LoaderCircle, Sparkles, Twitter, Linkedin, Facebook, Link as LinkIcon, ArrowLeft, ExternalLink, ListChecks, Eye, Cpu, TerminalSquare, Download, GitFork, ScrollText, FileText, Puzzle, CheckCircle2, AlertTriangle, AlertCircle, Info, X, Check, Heart, Users, CreditCard, Shield 
} from 'lucide-react';

const iconComponents: Record<string, React.ComponentType<LucideProps>> = {
  Rocket, Zap, BrainCircuit, Palette, Share2, Github, ShieldCheck, PlayCircle, LoaderCircle, Sparkles, Twitter, Linkedin, Facebook, Link: LinkIcon, ArrowLeft, ExternalLink, ListChecks, Eye, Cpu, TerminalSquare, Download, GitFork, ScrollText, FileText, Puzzle, CheckCircle2, AlertTriangle, AlertCircle, Info, X, Check, Heart, Users, CreditCard, Shield, 'check': Check, 'heart': Heart, 'users': Users, 'credit-card': CreditCard, 'shield': Shield, 'zap': Zap
};


interface IconProps extends LucideProps {
  name: string; // Icon name matching a key in iconComponents
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const LucideIconComponent = iconComponents[name];

  if (!LucideIconComponent) {
    console.warn(`Icon "${name}" not found. Rendering default (FileText).`);
    const DefaultIconComponent = iconComponents['FileText'];
    if (!DefaultIconComponent) {
      // Fallback if FileText itself is missing
      // Use props for size/color if available, defaulting as Lucide does.
      const { size, color, strokeWidth, ...restSvgProps } = props;
      const svgSize = size ?? 24;
      const svgColor = color ?? "currentColor";
      const svgStrokeWidth = strokeWidth ?? 2;

      return (
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={svgColor} 
          strokeWidth={svgStrokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          {...restSvgProps} // Spread other SVG attributes
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