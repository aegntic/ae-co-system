/**
 * Natural Language Parser
 * 
 * Converts natural language scripts into structured video segments
 * with visual elements, transitions, and timing
 */

import { v4 as uuidv4 } from 'uuid';
import { VideoScript, VideoSegment, VisualElement } from '../../types/video-types.js';

interface ParsedSection {
  type: 'narration' | 'visual' | 'code' | 'diagram' | 'transition';
  content: string;
  metadata?: Record<string, any>;
}

export class NaturalLanguageParser {
  private visualKeywords: Map<string, string>;
  private transitionKeywords: Map<string, string>;
  private emotionKeywords: Map<string, string>;

  constructor() {
    this.initializeKeywords();
  }

  /**
   * Initialize keyword mappings
   */
  private initializeKeywords(): void {
    // Visual cue keywords
    this.visualKeywords = new Map([
      ['show code', 'code'],
      ['display code', 'code'],
      ['here\'s the code', 'code'],
      ['let\'s look at', 'code'],
      ['show diagram', 'diagram'],
      ['visualize', 'diagram'],
      ['illustrate', 'diagram'],
      ['demonstrate', 'animation'],
      ['animate', 'animation'],
      ['highlight', 'highlight'],
      ['zoom in', 'zoom'],
      ['focus on', 'focus'],
      ['compare', 'split-screen'],
      ['side by side', 'split-screen'],
    ]);

    // Transition keywords
    this.transitionKeywords = new Map([
      ['next', 'wipe'],
      ['then', 'fade'],
      ['after that', 'dissolve'],
      ['moving on', 'slide'],
      ['let\'s switch', 'flip'],
      ['now', 'cut'],
      ['meanwhile', 'split'],
      ['finally', 'zoom'],
    ]);

    // Emotion keywords for voice modulation
    this.emotionKeywords = new Map([
      ['excited', 'excited'],
      ['important', 'emphasis'],
      ['careful', 'cautious'],
      ['warning', 'serious'],
      ['great', 'happy'],
      ['unfortunately', 'sad'],
      ['interestingly', 'curious'],
      ['surprisingly', 'surprised'],
    ]);
  }

  /**
   * Parse natural language script into structured video script
   */
  async parseScript(scriptText: string): Promise<VideoScript> {
    const scriptId = uuidv4();
    const sections = this.splitIntoSections(scriptText);
    const segments: VideoSegment[] = [];
    let currentTime = 0;

    for (const section of sections) {
      const segment = await this.parseSection(section, currentTime);
      segments.push(segment);
      currentTime += segment.duration;
    }

    return {
      id: scriptId,
      title: this.extractTitle(scriptText),
      segments,
      metadata: {
        totalDuration: currentTime,
        language: 'en-US',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Split script into logical sections
   */
  private splitIntoSections(scriptText: string): ParsedSection[] {
    const sections: ParsedSection[] = [];
    const lines = scriptText.split('\n').filter(line => line.trim());
    
    let currentSection: ParsedSection | null = null;
    let codeBlock = '';
    let inCodeBlock = false;

    for (const line of lines) {
      // Check for code blocks
      if (line.includes('```')) {
        if (!inCodeBlock) {
          // Start of code block
          if (currentSection) {
            sections.push(currentSection);
          }
          inCodeBlock = true;
          codeBlock = '';
          const language = line.replace('```', '').trim();
          currentSection = {
            type: 'code',
            content: '',
            metadata: { language: language || 'javascript' },
          };
        } else {
          // End of code block
          inCodeBlock = false;
          if (currentSection) {
            currentSection.content = codeBlock;
            sections.push(currentSection);
            currentSection = null;
          }
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlock += line + '\n';
        continue;
      }

      // Check for visual cues
      const visualType = this.detectVisualCue(line);
      if (visualType) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'visual',
          content: line,
          metadata: { visualType },
        };
        continue;
      }

      // Check for transitions
      const transitionType = this.detectTransition(line);
      if (transitionType && currentSection) {
        currentSection.metadata = {
          ...currentSection.metadata,
          transition: transitionType,
        };
      }

      // Regular narration
      if (!currentSection || currentSection.type !== 'narration') {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'narration',
          content: line,
        };
      } else {
        currentSection.content += ' ' + line;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Parse individual section into video segment
   */
  private async parseSection(
    section: ParsedSection,
    startTime: number
  ): Promise<VideoSegment> {
    const segmentId = uuidv4();
    const duration = this.estimateDuration(section);
    const emotion = this.detectEmotion(section.content);

    const segment: VideoSegment = {
      id: segmentId,
      startTime,
      duration,
      type: section.type === 'narration' ? 'narration' : 'visual',
      visuals: [],
    };

    switch (section.type) {
      case 'narration':
        segment.narration = section.content;
        segment.emotion = emotion;
        segment.visuals = this.generateDefaultVisuals(section.content);
        break;

      case 'code':
        segment.visuals = [{
          type: 'code',
          content: section.content,
          language: section.metadata?.language || 'javascript',
          position: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          animation: 'typewriter',
          duration,
        }];
        segment.narration = `Here's the code implementation`;
        break;

      case 'visual':
        const visualType = section.metadata?.visualType || 'diagram';
        segment.visuals = [{
          type: visualType,
          content: this.extractVisualContent(section.content, visualType),
          position: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          animation: this.getAnimationForVisual(visualType),
          duration,
        }];
        break;

      case 'diagram':
        segment.visuals = [{
          type: 'diagram',
          diagramType: 'flowchart',
          content: this.parseDiagramContent(section.content),
          position: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          animation: 'draw',
          duration,
        }];
        break;
    }

    // Add transition if specified
    if (section.metadata?.transition) {
      segment.transition = section.metadata.transition;
    }

    return segment;
  }

  /**
   * Detect visual cues in text
   */
  private detectVisualCue(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const [keyword, visualType] of this.visualKeywords.entries()) {
      if (lowerText.includes(keyword)) {
        return visualType;
      }
    }
    
    return null;
  }

  /**
   * Detect transition keywords
   */
  private detectTransition(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    for (const [keyword, transition] of this.transitionKeywords.entries()) {
      if (lowerText.startsWith(keyword)) {
        return transition;
      }
    }
    
    return null;
  }

  /**
   * Detect emotion in text
   */
  private detectEmotion(text: string): string {
    const lowerText = text.toLowerCase();
    
    for (const [keyword, emotion] of this.emotionKeywords.entries()) {
      if (lowerText.includes(keyword)) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  /**
   * Estimate duration based on content
   */
  private estimateDuration(section: ParsedSection): number {
    switch (section.type) {
      case 'narration':
        // Estimate ~150 words per minute
        const wordCount = section.content.split(' ').length;
        return Math.max(2, (wordCount / 150) * 60);
      
      case 'code':
        // Allow time to read code
        const lineCount = section.content.split('\n').length;
        return Math.max(5, lineCount * 0.5);
      
      case 'visual':
      case 'diagram':
        // Fixed duration for visuals
        return 5;
      
      default:
        return 3;
    }
  }

  /**
   * Generate default visuals for narration
   */
  private generateDefaultVisuals(text: string): VisualElement[] {
    const visuals: VisualElement[] = [];
    
    // Add subtle background animation
    visuals.push({
      type: 'background',
      content: 'gradient-animation',
      position: { x: 0, y: 0, width: 1, height: 1 },
      animation: 'pulse',
      duration: 0,
    });

    // Add text highlights for key points
    const keyPoints = this.extractKeyPoints(text);
    if (keyPoints.length > 0) {
      visuals.push({
        type: 'text-overlay',
        content: keyPoints.join('\n'),
        position: { x: 0.1, y: 0.7, width: 0.8, height: 0.2 },
        animation: 'fade-in',
        duration: 0,
      });
    }

    return visuals;
  }

  /**
   * Extract key points from text
   */
  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    
    // Simple extraction based on sentence importance
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      if (
        sentence.includes('important') ||
        sentence.includes('key') ||
        sentence.includes('remember') ||
        sentence.includes('note') ||
        sentence.length < 50
      ) {
        keyPoints.push('• ' + sentence.trim());
      }
    }
    
    return keyPoints.slice(0, 3); // Max 3 key points
  }

  /**
   * Extract visual content from text
   */
  private extractVisualContent(text: string, visualType: string): any {
    // Remove the visual cue keywords
    let content = text;
    for (const keyword of this.visualKeywords.keys()) {
      content = content.replace(new RegExp(keyword, 'gi'), '');
    }
    
    return content.trim();
  }

  /**
   * Get appropriate animation for visual type
   */
  private getAnimationForVisual(visualType: string): string {
    const animations: Record<string, string> = {
      code: 'typewriter',
      diagram: 'draw',
      animation: 'morph',
      highlight: 'glow',
      zoom: 'zoom-in',
      focus: 'blur-focus',
      'split-screen': 'slide-in',
    };
    
    return animations[visualType] || 'fade-in';
  }

  /**
   * Parse diagram content from text
   */
  private parseDiagramContent(text: string): any {
    // Simple diagram parser - can be extended
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Extract nodes (words in quotes or capitalized)
    const nodeMatches = text.match(/"([^"]+)"|([A-Z]\w+)/g);
    if (nodeMatches) {
      nodeMatches.forEach((match, index) => {
        const label = match.replace(/"/g, '');
        nodes.push({
          id: `node-${index}`,
          label,
          type: 'default',
        });
      });
    }
    
    // Extract relationships (arrows ->)
    const edgeMatches = text.match(/(\w+)\s*->\s*(\w+)/g);
    if (edgeMatches) {
      edgeMatches.forEach((match, index) => {
        const [source, target] = match.split('->').map(s => s.trim());
        edges.push({
          id: `edge-${index}`,
          source: nodes.find(n => n.label === source)?.id,
          target: nodes.find(n => n.label === target)?.id,
        });
      });
    }
    
    return { nodes, edges };
  }

  /**
   * Extract title from script
   */
  private extractTitle(scriptText: string): string {
    const lines = scriptText.split('\n');
    
    // Look for markdown-style title
    const titleLine = lines.find(line => line.startsWith('#'));
    if (titleLine) {
      return titleLine.replace(/^#+\s*/, '').trim();
    }
    
    // Use first line as title
    return lines[0]?.trim() || 'Untitled Video';
  }
}