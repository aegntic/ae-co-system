/**
 * VideoComposition Component for Remotion
 * 
 * Main composition that orchestrates all video segments
 */

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
import { CodeBlock } from './CodeBlock';
import { TextOverlay } from './TextOverlay';
import { Diagram } from './Diagram';
import { AnimatedGraphic } from './AnimatedGraphic';
import { TransitionWrapper } from './Transition';
import { VideoScript, VideoSegment, VisualElement } from '../../types/video-types';

interface VideoCompositionProps {
  videoScript: VideoScript;
  audioFiles: string[];
  style: any;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  videoScript,
  audioFiles,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background component
  const renderBackground = (visual: VisualElement) => {
    if (visual.content === 'gradient-animation') {
      const hue = interpolate(frame, [0, fps * 10], [0, 360], {
        extrapolateRight: 'wrap',
      });

      return (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, 
              hsl(${hue}, 70%, 20%) 0%, 
              hsl(${(hue + 60) % 360}, 70%, 30%) 100%)`,
          }}
        />
      );
    }

    return (
      <AbsoluteFill
        style={{
          backgroundColor: style.backgroundColor || '#282a36',
        }}
      />
    );
  };

  // Render visual elements
  const renderVisual = (visual: VisualElement, segmentStyle: any) => {
    const props = {
      ...visual,
      style: { ...style, ...segmentStyle, ...visual.style },
    };

    switch (visual.type) {
      case 'code':
        return (
          <CodeBlock
            code={visual.content}
            language={visual.language || 'javascript'}
            style={props.style}
            animate={visual.animation === 'typewriter'}
            highlightLines={visual.content.highlightLines}
          />
        );

      case 'text-overlay':
        return (
          <TextOverlay
            text={visual.content}
            position={visual.position as any}
            style={props.style}
            animation={visual.animation as any}
          />
        );

      case 'diagram':
        return (
          <Diagram
            nodes={visual.content.nodes || []}
            edges={visual.content.edges || []}
            diagramType={visual.diagramType || 'flowchart'}
            style={props.style}
            animate={true}
          />
        );

      case 'animation':
      case 'image':
        return (
          <AnimatedGraphic
            type={visual.content.type || 'shape'}
            content={visual.content.value || 'circle'}
            style={props.style}
            animation={visual.animation as any}
            position={{
              x: visual.position.x,
              y: visual.position.y,
            }}
            size={{
              width: visual.position.width * 1920,
              height: visual.position.height * 1080,
            }}
          />
        );

      case 'background':
        return renderBackground(visual);

      case 'highlight':
        return (
          <div
            style={{
              position: 'absolute',
              left: `${visual.position.x * 100}%`,
              top: `${visual.position.y * 100}%`,
              width: `${visual.position.width * 100}%`,
              height: `${visual.position.height * 100}%`,
              border: `3px solid ${props.style.primaryColor || '#ff79c6'}`,
              borderRadius: 8,
              backgroundColor: 'rgba(255, 121, 198, 0.1)',
              opacity: spring({
                frame,
                fps,
                config: {
                  damping: 100,
                  stiffness: 200,
                },
              }),
            }}
          />
        );

      case 'zoom':
      case 'focus':
        const scale = visual.type === 'zoom' ? 1.5 : 1.2;
        const blurAmount = visual.type === 'focus' ? 10 : 0;
        
        return (
          <div
            style={{
              position: 'absolute',
              left: `${visual.position.x * 100}%`,
              top: `${visual.position.y * 100}%`,
              width: `${visual.position.width * 100}%`,
              height: `${visual.position.height * 100}%`,
              transform: `scale(${interpolate(
                spring({
                  frame,
                  fps,
                  config: {
                    damping: 100,
                    stiffness: 100,
                  },
                }),
                [0, 1],
                [1, scale]
              )})`,
              transformOrigin: 'center',
              filter: `blur(${blurAmount}px)`,
            }}
          />
        );

      default:
        return null;
    }
  };

  // Render a complete segment
  const renderSegment = (segment: VideoSegment, audioIndex: number) => {
    const segmentStyle = {
      ...style,
      // Add emotion-based styling
      ...(segment.emotion === 'excited' && { animationSpeed: 1.2 }),
      ...(segment.emotion === 'emphasis' && { fontSize: (style.fontSize || 24) * 1.1 }),
      ...(segment.emotion === 'cautious' && { primaryColor: '#ff5555' }),
    };

    return (
      <AbsoluteFill>
        {/* Render visual elements in order */}
        {segment.visuals.map((visual, index) => (
          <React.Fragment key={`${segment.id}-visual-${index}`}>
            {renderVisual(visual, segmentStyle)}
          </React.Fragment>
        ))}

        {/* Render narration text if present */}
        {segment.narration && segment.text && (
          <TextOverlay
            text={segment.text}
            position={segment.textPosition || 'bottom'}
            style={segmentStyle}
            animation="fade"
          />
        )}

        {/* Audio narration */}
        {audioFiles[audioIndex] && (
          <Audio
            src={audioFiles[audioIndex]}
            volume={1}
            startFrom={0}
          />
        )}
      </AbsoluteFill>
    );
  };

  // Calculate frame positions for each segment
  let currentFrame = 0;
  const segments = videoScript.segments.map((segment, index) => {
    const startFrame = currentFrame;
    const durationInFrames = Math.floor(segment.duration * fps);
    currentFrame += durationInFrames;

    return {
      segment,
      startFrame,
      durationInFrames,
      audioIndex: index,
    };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: style.backgroundColor || '#282a36' }}>
      {segments.map(({ segment, startFrame, durationInFrames, audioIndex }, index) => {
        const nextSegment = segments[index + 1];
        const hasTransition = segment.transition && nextSegment;

        return (
          <Sequence
            key={segment.id}
            from={startFrame}
            durationInFrames={durationInFrames}
          >
            {hasTransition ? (
              <TransitionWrapper
                from={renderSegment(segment, audioIndex)}
                to={nextSegment ? renderSegment(nextSegment.segment, nextSegment.audioIndex) : null}
                transition={{
                  type: segment.transition as any,
                  duration: 1, // 1 second transition
                  style,
                }}
                currentFrame={frame - startFrame}
                transitionStartFrame={durationInFrames - fps} // Start transition 1 second before end
                transitionDuration={fps}
              />
            ) : (
              renderSegment(segment, audioIndex)
            )}
          </Sequence>
        );
      })}

      {/* Global overlay elements */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          fontSize: 12,
          color: style.secondaryColor || '#6272a4',
          fontFamily: style.fontFamily || 'Inter, system-ui, sans-serif',
          opacity: 0.5,
        }}
      >
        Powered by DailyDoco Pro
      </div>
    </AbsoluteFill>
  );
};