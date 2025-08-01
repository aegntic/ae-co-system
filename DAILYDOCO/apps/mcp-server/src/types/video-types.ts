/**
 * Video Generation Type Definitions
 */

export interface VideoScript {
  id: string;
  title: string;
  segments: VideoSegment[];
  metadata: {
    totalDuration: number;
    language: string;
    generatedAt: string;
    tags?: string[];
    description?: string;
  };
}

export interface VideoSegment {
  id: string;
  startTime: number;
  duration: number;
  type: 'narration' | 'visual' | 'transition' | 'composite';
  narration?: string;
  text?: string;
  textPosition?: 'top' | 'bottom' | 'center' | 'custom';
  visuals: VisualElement[];
  transition?: string;
  emotion?: string;
  speed?: number;
}

export interface VisualElement {
  type: 'code' | 'diagram' | 'animation' | 'image' | 'video' | 'text-overlay' | 'background' | 'highlight' | 'zoom' | 'focus' | 'split-screen';
  content: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  animation?: string;
  duration: number;
  language?: string;
  diagramType?: 'flowchart' | 'sequence' | 'architecture' | 'mindmap';
  style?: Record<string, any>;
}

export interface RemotionComposition {
  id: string;
  component: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, any>;
}

export interface VideoStyle {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  animationSpeed?: number;
  theme?: 'light' | 'dark' | 'custom';
}

export interface AudioSegment {
  id: string;
  path: string;
  duration: number;
  startTime: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface VideoMetadata {
  resolution: string;
  fps: number;
  codec: string;
  bitrate?: number;
  fileSize: number;
  duration: number;
  format: string;
}

export interface CompilationProgress {
  stage: 'parsing' | 'audio' | 'composing' | 'rendering' | 'post-processing' | 'complete';
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
  errors?: string[];
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  style: VideoStyle;
  transitions: string[];
  animations: string[];
  layouts: Record<string, any>;
}