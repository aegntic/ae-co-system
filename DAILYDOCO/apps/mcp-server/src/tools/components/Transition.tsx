/**
 * Transition Component for Remotion
 * 
 * Handles transitions between video segments
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

interface TransitionProps {
  type: 'fade' | 'wipe' | 'slide' | 'dissolve' | 'flip' | 'cut' | 'split' | 'zoom';
  direction?: 'left' | 'right' | 'up' | 'down';
  duration: number;
  style?: any;
}

export const Transition: React.FC<TransitionProps> = ({
  type,
  direction = 'right',
  duration,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate progress (0 to 1) over the transition duration
  const progress = interpolate(
    frame,
    [0, duration * fps],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  // Render different transition types
  switch (type) {
    case 'fade':
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: style?.backgroundColor || '#000000',
            opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            pointerEvents: 'none',
          }}
        />
      );

    case 'wipe':
      const wipePosition = {
        left: { left: `${progress * 100}%`, width: `${(1 - progress) * 100}%` },
        right: { right: `${progress * 100}%`, width: `${(1 - progress) * 100}%` },
        up: { top: `${progress * 100}%`, height: `${(1 - progress) * 100}%` },
        down: { bottom: `${progress * 100}%`, height: `${(1 - progress) * 100}%` },
      }[direction];

      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              backgroundColor: style?.primaryColor || '#ff79c6',
              ...wipePosition,
              ...(direction === 'left' || direction === 'right'
                ? { top: 0, height: '100%' }
                : { left: 0, width: '100%' }),
            }}
          />
        </div>
      );

    case 'slide':
      const slideTransform = {
        left: `translateX(${(1 - progress) * 100}%)`,
        right: `translateX(${(progress - 1) * 100}%)`,
        up: `translateY(${(1 - progress) * 100}%)`,
        down: `translateY(${(progress - 1) * 100}%)`,
      }[direction];

      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: style?.backgroundColor || '#282a36',
            transform: slideTransform,
            pointerEvents: 'none',
          }}
        />
      );

    case 'dissolve':
      return (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <filter id="dissolve-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02"
                numOctaves="5"
                result="turbulence"
                seed="5"
              />
              <feColorMatrix
                in="turbulence"
                type="saturate"
                values="0"
                result="desaturatedTurbulence"
              />
              <feComponentTransfer result="discrete">
                <feFuncA
                  type="discrete"
                  tableValues={Array.from({ length: 10 }, (_, i) =>
                    i / 10 < progress ? 0 : 1
                  ).join(' ')}
                />
              </feComponentTransfer>
              <feComposite
                in="SourceGraphic"
                in2="discrete"
                operator="multiply"
              />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={style?.backgroundColor || '#000000'}
            filter="url(#dissolve-filter)"
            opacity={1 - progress}
          />
        </svg>
      );

    case 'flip':
      const flipProgress = interpolate(
        progress,
        [0, 0.5, 1],
        [0, 90, 180],
        {
          easing: Easing.inOut(Easing.ease),
        }
      );

      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            perspective: '1000px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: style?.primaryColor || '#ff79c6',
              transform: `rotateY(${flipProgress}deg)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
          />
        </div>
      );

    case 'split':
      return (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              backgroundColor: style?.primaryColor || '#ff79c6',
              transform: `translateX(${-progress * 100}%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              backgroundColor: style?.primaryColor || '#ff79c6',
              transform: `translateX(${progress * 100}%)`,
            }}
          />
        </div>
      );

    case 'zoom':
      const zoomScale = interpolate(
        progress,
        [0, 0.5, 1],
        [1, 0, 1],
        {
          easing: Easing.inOut(Easing.ease),
        }
      );

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '200%',
            transform: `translate(-50%, -50%) scale(${zoomScale})`,
            backgroundColor: style?.backgroundColor || '#000000',
            borderRadius: '50%',
            opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 0]),
            pointerEvents: 'none',
          }}
        />
      );

    case 'cut':
    default:
      // Cut transition is instant, no visual effect
      return null;
  }
};

/**
 * Transition wrapper that combines two segments with a transition
 */
export const TransitionWrapper: React.FC<{
  from: React.ReactNode;
  to: React.ReactNode;
  transition: TransitionProps;
  currentFrame: number;
  transitionStartFrame: number;
  transitionDuration: number;
}> = ({ from, to, transition, currentFrame, transitionStartFrame, transitionDuration }) => {
  const transitionEndFrame = transitionStartFrame + transitionDuration;

  // Determine which content to show
  if (currentFrame < transitionStartFrame) {
    // Show 'from' content before transition
    return <>{from}</>;
  } else if (currentFrame >= transitionEndFrame) {
    // Show 'to' content after transition
    return <>{to}</>;
  } else {
    // During transition
    const transitionFrame = currentFrame - transitionStartFrame;
    
    return (
      <>
        {/* Show both contents with appropriate opacity */}
        <div style={{ opacity: 1 - (transitionFrame / transitionDuration) }}>
          {from}
        </div>
        <div style={{ opacity: transitionFrame / transitionDuration }}>
          {to}
        </div>
        
        {/* Overlay transition effect */}
        <Transition {...transition} />
      </>
    );
  }
};