/**
 * TextOverlay Component for Remotion
 * 
 * Displays text overlays with animations
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

interface TextOverlayProps {
  text: string;
  position: 'top' | 'bottom' | 'center' | 'custom';
  style: any;
  customPosition?: { x: number; y: number };
  animation?: 'fade' | 'slide' | 'typewriter' | 'bounce';
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  position,
  style,
  customPosition,
  animation = 'fade',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation progress
  const progress = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // Position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { bottom: '10%', left: '50%', transform: 'translateX(-50%)' };
      case 'center':
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'custom':
        return {
          left: `${customPosition?.x || 50}%`,
          top: `${customPosition?.y || 50}%`,
          transform: 'translate(-50%, -50%)',
        };
      default:
        return {};
    }
  };

  // Animation styles
  const getAnimationStyle = () => {
    switch (animation) {
      case 'fade':
        return {
          opacity: progress,
        };
      case 'slide':
        return {
          opacity: progress,
          transform: `${getPositionStyle().transform} translateY(${interpolate(
            progress,
            [0, 1],
            [20, 0]
          )}px)`,
        };
      case 'bounce':
        return {
          opacity: progress,
          transform: `${getPositionStyle().transform} scale(${spring({
            frame: frame - 10,
            fps,
            config: {
              damping: 10,
              stiffness: 300,
              mass: 0.5,
            },
          })})`,
        };
      case 'typewriter':
        const visibleChars = Math.floor(progress * text.length);
        return {
          opacity: 1,
        };
      default:
        return {};
    }
  };

  // Typewriter text
  const displayText = animation === 'typewriter'
    ? text.substring(0, Math.floor(progress * text.length))
    : text;

  return (
    <div
      style={{
        position: 'absolute',
        ...getPositionStyle(),
        ...getAnimationStyle(),
        padding: '20px 40px',
        backgroundColor: style.backgroundColor || 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        fontFamily: style.fontFamily || 'Inter, system-ui, sans-serif',
        fontSize: style.fontSize || 24,
        fontWeight: 600,
        color: style.color || '#ffffff',
        textAlign: 'center',
        maxWidth: '80%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {displayText}
      {animation === 'typewriter' && progress < 1 && (
        <span
          style={{
            display: 'inline-block',
            width: 3,
            height: '1.2em',
            backgroundColor: style.primaryColor || '#ff79c6',
            marginLeft: 2,
            animation: 'blink 1s infinite',
          }}
        />
      )}
    </div>
  );
};