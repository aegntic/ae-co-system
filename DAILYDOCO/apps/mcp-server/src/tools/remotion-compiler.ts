/**
 * Remotion Video Compiler
 * 
 * Replaces the traditional video compilation with Remotion-based
 * programmatic video generation with text-to-speech narration
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { getCompositions } from '@remotion/renderer';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { TTSEngine } from './tts-engine.js';
import { NaturalLanguageParser } from './natural-language-parser.js';
import { VideoScript, VideoSegment, VisualElement } from '../../types/video-types.js';

export interface RemotionCompilationOptions {
  script: string;
  template?: 'tutorial' | 'demo' | 'explanation' | 'showcase';
  voiceId?: string;
  style?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    animationSpeed?: number;
  };
  quality?: 'draft' | 'standard' | 'high' | 'ultra';
  format?: 'mp4' | 'webm' | 'gif';
}

export interface CompilationResult {
  videoId: string;
  outputPath: string;
  duration: number;
  segments: VideoSegment[];
  metadata: {
    resolution: string;
    fps: number;
    codec: string;
    fileSize: number;
  };
}

export class RemotionCompiler {
  private ttsEngine: TTSEngine;
  private nlpParser: NaturalLanguageParser;
  private outputDir: string;

  constructor() {
    this.ttsEngine = new TTSEngine();
    this.nlpParser = new NaturalLanguageParser();
    this.outputDir = process.env.VIDEO_OUTPUT_DIR || '/tmp/dailydoco/videos';
  }

  /**
   * Compile a video from natural language script using Remotion
   */
  async compileVideo(options: RemotionCompilationOptions): Promise<CompilationResult> {
    const videoId = uuidv4();
    const startTime = Date.now();

    try {
      // 1. Parse the natural language script
      console.log('Parsing natural language script...');
      const videoScript = await this.nlpParser.parseScript(options.script);

      // 2. Generate TTS audio for narration
      console.log('Generating text-to-speech audio...');
      const audioSegments = await this.generateAudioSegments(videoScript, options.voiceId);

      // 3. Create Remotion composition
      console.log('Creating Remotion composition...');
      const compositionPath = await this.createComposition(videoScript, audioSegments, options);

      // 4. Bundle the Remotion project
      console.log('Bundling Remotion project...');
      const bundleLocation = await bundle({
        entryPoint: compositionPath,
        webpackOverride: (config) => config,
      });

      // 5. Get composition details
      const compositions = await getCompositions(bundleLocation, {
        inputProps: this.getInputProps(videoScript, audioSegments, options),
      });

      const composition = selectComposition({
        compositions,
        id: 'DailyDocoVideo',
      });

      // 6. Render the video
      console.log('Rendering video with Remotion...');
      const outputPath = path.join(this.outputDir, `${videoId}.${options.format || 'mp4'}`);
      
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: this.getCodec(options.format),
        outputLocation: outputPath,
        inputProps: this.getInputProps(videoScript, audioSegments, options),
        imageFormat: 'jpeg',
        quality: this.getQuality(options.quality),
        envVariables: {
          NODE_ENV: 'production',
        },
        onProgress: ({ progress }) => {
          console.log(`Rendering progress: ${Math.round(progress * 100)}%`);
        },
      });

      // 7. Get video metadata
      const stats = await fs.stat(outputPath);
      const metadata = {
        resolution: this.getResolution(options.quality),
        fps: composition.fps,
        codec: this.getCodec(options.format),
        fileSize: stats.size,
      };

      // 8. Clean up bundle
      await fs.rm(bundleLocation, { recursive: true, force: true });

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Video compilation completed in ${duration}s`);

      return {
        videoId,
        outputPath,
        duration: composition.durationInFrames / composition.fps,
        segments: videoScript.segments,
        metadata,
      };
    } catch (error) {
      console.error('Error compiling video:', error);
      throw new Error(`Video compilation failed: ${error.message}`);
    }
  }

  /**
   * Generate audio segments using TTS
   */
  private async generateAudioSegments(
    script: VideoScript,
    voiceId?: string
  ): Promise<Map<string, string>> {
    const audioMap = new Map<string, string>();

    for (const segment of script.segments) {
      if (segment.narration) {
        const audioPath = await this.ttsEngine.generateAudio({
          text: segment.narration,
          voiceId: voiceId || 'default',
          emotion: segment.emotion,
          speed: segment.speed || 1.0,
        });
        audioMap.set(segment.id, audioPath);
      }
    }

    return audioMap;
  }

  /**
   * Create Remotion composition file
   */
  private async createComposition(
    script: VideoScript,
    audioSegments: Map<string, string>,
    options: RemotionCompilationOptions
  ): Promise<string> {
    const compositionDir = path.join(this.outputDir, 'compositions', script.id);
    await fs.mkdir(compositionDir, { recursive: true });

    // Create Root.tsx
    const rootComponent = this.generateRootComponent(script, audioSegments, options);
    const rootPath = path.join(compositionDir, 'Root.tsx');
    await fs.writeFile(rootPath, rootComponent);

    // Create Video.tsx
    const videoComponent = this.generateVideoComponent(script, options);
    const videoPath = path.join(compositionDir, 'Video.tsx');
    await fs.writeFile(videoPath, videoComponent);

    // Create index.tsx
    const indexContent = this.generateIndexFile();
    const indexPath = path.join(compositionDir, 'index.tsx');
    await fs.writeFile(indexPath, indexContent);

    return indexPath;
  }

  /**
   * Generate Root component for Remotion
   */
  private generateRootComponent(
    script: VideoScript,
    audioSegments: Map<string, string>,
    options: RemotionCompilationOptions
  ): string {
    return `
import { Composition } from 'remotion';
import { DailyDocoVideo } from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DailyDocoVideo"
        component={DailyDocoVideo}
        durationInFrames={${this.calculateTotalFrames(script)}}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          script: ${JSON.stringify(script)},
          audioSegments: ${JSON.stringify(Array.from(audioSegments.entries()))},
          style: ${JSON.stringify(options.style || {})},
          template: "${options.template || 'tutorial'}"
        }}
      />
    </>
  );
};
`;
  }

  /**
   * Generate Video component
   */
  private generateVideoComponent(
    script: VideoScript,
    options: RemotionCompilationOptions
  ): string {
    return `
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { CodeBlock } from './components/CodeBlock';
import { Diagram } from './components/Diagram';
import { TextOverlay } from './components/TextOverlay';
import { Transition } from './components/Transition';

export const DailyDocoVideo: React.FC<{
  script: any;
  audioSegments: [string, string][];
  style: any;
  template: string;
}> = ({ script, audioSegments, style, template }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioMap = new Map(audioSegments);

  return (
    <AbsoluteFill style={{ backgroundColor: style.backgroundColor || '#1a1a1a' }}>
      {script.segments.map((segment: any, index: number) => {
        const startFrame = segment.startTime * fps;
        const durationFrames = segment.duration * fps;

        return (
          <Sequence
            key={segment.id}
            from={startFrame}
            durationInFrames={durationFrames}
          >
            <AbsoluteFill>
              {/* Background visuals */}
              {segment.visuals.map((visual: any, vIndex: number) => (
                <VisualElement
                  key={vIndex}
                  visual={visual}
                  style={style}
                  template={template}
                />
              ))}

              {/* Text overlay */}
              {segment.text && (
                <TextOverlay
                  text={segment.text}
                  position={segment.textPosition || 'bottom'}
                  style={style}
                />
              )}

              {/* Audio narration */}
              {audioMap.has(segment.id) && (
                <Audio src={audioMap.get(segment.id)} />
              )}

              {/* Transitions */}
              {index < script.segments.length - 1 && (
                <Transition
                  type={segment.transition || 'fade'}
                  duration={0.5}
                  startAt={durationFrames - 15}
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const VisualElement: React.FC<{ visual: any; style: any; template: string }> = ({
  visual,
  style,
  template,
}) => {
  const frame = useCurrentFrame();
  
  switch (visual.type) {
    case 'code':
      return (
        <CodeBlock
          code={visual.content}
          language={visual.language || 'typescript'}
          style={style}
          animate={true}
        />
      );
    
    case 'diagram':
      return (
        <Diagram
          data={visual.content}
          type={visual.diagramType}
          style={style}
        />
      );
    
    case 'animation':
      return (
        <AnimatedGraphic
          type={visual.animationType}
          data={visual.content}
          style={style}
        />
      );
    
    default:
      return null;
  }
};
`;
  }

  /**
   * Generate index file
   */
  private generateIndexFile(): string {
    return `
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);
`;
  }

  /**
   * Calculate total frames based on script duration
   */
  private calculateTotalFrames(script: VideoScript): number {
    const totalDuration = script.segments.reduce(
      (sum, segment) => sum + segment.duration,
      0
    );
    return Math.ceil(totalDuration * 30); // 30 fps
  }

  /**
   * Get input props for Remotion
   */
  private getInputProps(
    script: VideoScript,
    audioSegments: Map<string, string>,
    options: RemotionCompilationOptions
  ): Record<string, any> {
    return {
      script,
      audioSegments: Array.from(audioSegments.entries()),
      style: options.style || {},
      template: options.template || 'tutorial',
    };
  }

  /**
   * Get codec based on format
   */
  private getCodec(format?: string): 'h264' | 'h265' | 'vp8' | 'vp9' | 'gif' {
    switch (format) {
      case 'webm':
        return 'vp9';
      case 'gif':
        return 'gif';
      default:
        return 'h264';
    }
  }

  /**
   * Get quality settings
   */
  private getQuality(quality?: string): number {
    switch (quality) {
      case 'draft':
        return 60;
      case 'standard':
        return 80;
      case 'ultra':
        return 100;
      default:
        return 90;
    }
  }

  /**
   * Get resolution based on quality
   */
  private getResolution(quality?: string): string {
    switch (quality) {
      case 'draft':
        return '1280x720';
      case 'ultra':
        return '3840x2160';
      default:
        return '1920x1080';
    }
  }

  /**
   * Get compilation status
   */
  async getCompilationStatus(compilationId: string): Promise<any> {
    // Implementation for getting status
    return {
      content: {
        status: 'completed',
        progress: 100,
        compilationId,
      },
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup temporary files
    const tempDir = path.join(this.outputDir, 'temp');
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}