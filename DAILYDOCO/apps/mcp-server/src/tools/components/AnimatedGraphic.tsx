/**
 * AnimatedGraphic Component for Remotion
 * 
 * Displays animated graphics, icons, and shapes
 */

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

interface AnimatedGraphicProps {
  type: 'icon' | 'shape' | 'pattern' | 'particle' | 'wave' | 'logo';
  content: any;
  style: any;
  animation?: 'pulse' | 'rotate' | 'bounce' | 'morph' | 'float' | 'draw';
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export const AnimatedGraphic: React.FC<AnimatedGraphicProps> = ({
  type,
  content,
  style,
  animation = 'pulse',
  position = { x: 0.5, y: 0.5 },
  size = { width: 200, height: 200 },
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Calculate position in pixels
  const x = position.x * width;
  const y = position.y * height;

  // Animation progress
  const progress = spring({
    frame,
    fps,
    config: {
      damping: 100,
      stiffness: 100,
      mass: 0.5,
    },
  });

  // Get animation styles
  const getAnimationStyle = () => {
    switch (animation) {
      case 'pulse':
        const pulseScale = interpolate(
          frame % (fps * 2),
          [0, fps, fps * 2],
          [1, 1.1, 1],
          {
            easing: Easing.inOut(Easing.ease),
          }
        );
        return { transform: `scale(${pulseScale})` };

      case 'rotate':
        const rotation = interpolate(frame, [0, fps * 4], [0, 360]);
        return { transform: `rotate(${rotation}deg)` };

      case 'bounce':
        const bounceY = interpolate(
          frame % (fps * 1.5),
          [0, fps * 0.75, fps * 1.5],
          [0, -30, 0],
          {
            easing: Easing.inOut(Easing.quad),
          }
        );
        return { transform: `translateY(${bounceY}px)` };

      case 'float':
        const floatY = Math.sin((frame / fps) * Math.PI * 0.5) * 20;
        const floatX = Math.cos((frame / fps) * Math.PI * 0.3) * 10;
        return { transform: `translate(${floatX}px, ${floatY}px)` };

      case 'morph':
        const morphProgress = (frame % (fps * 3)) / (fps * 3);
        return { clipPath: getMorphPath(morphProgress) };

      case 'draw':
        return { strokeDashoffset: 1000 * (1 - progress) };

      default:
        return {};
    }
  };

  // Render different graphic types
  const renderGraphic = () => {
    switch (type) {
      case 'icon':
        return renderIcon();
      case 'shape':
        return renderShape();
      case 'pattern':
        return renderPattern();
      case 'particle':
        return renderParticles();
      case 'wave':
        return renderWave();
      case 'logo':
        return renderLogo();
      default:
        return null;
    }
  };

  // Icon rendering (simple SVG icons)
  const renderIcon = () => {
    const iconMap: Record<string, JSX.Element> = {
      play: (
        <polygon
          points="20,15 20,45 45,30"
          fill={style.primaryColor || '#ff79c6'}
        />
      ),
      code: (
        <>
          <polyline
            points="15,20 5,30 15,40"
            fill="none"
            stroke={style.primaryColor || '#ff79c6'}
            strokeWidth="3"
          />
          <polyline
            points="35,20 45,30 35,40"
            fill="none"
            stroke={style.primaryColor || '#ff79c6'}
            strokeWidth="3"
          />
        </>
      ),
      check: (
        <polyline
          points="10,30 20,40 40,15"
          fill="none"
          stroke={style.primaryColor || '#50fa7b'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
      star: (
        <polygon
          points="25,5 30,15 40,15 32,22 35,32 25,25 15,32 18,22 10,15 20,15"
          fill={style.primaryColor || '#f1fa8c'}
        />
      ),
    };

    return (
      <svg width={size.width} height={size.height} viewBox="0 0 50 50">
        {iconMap[content] || iconMap.play}
      </svg>
    );
  };

  // Shape rendering
  const renderShape = () => {
    const shapes: Record<string, JSX.Element> = {
      circle: (
        <circle
          cx={size.width / 2}
          cy={size.height / 2}
          r={size.width / 2 - 10}
          fill={style.primaryColor || '#ff79c6'}
          opacity={0.8}
        />
      ),
      square: (
        <rect
          x={10}
          y={10}
          width={size.width - 20}
          height={size.height - 20}
          fill={style.primaryColor || '#ff79c6'}
          opacity={0.8}
        />
      ),
      triangle: (
        <polygon
          points={`${size.width / 2},10 ${size.width - 10},${size.height - 10} 10,${size.height - 10}`}
          fill={style.primaryColor || '#ff79c6'}
          opacity={0.8}
        />
      ),
      hexagon: (
        <polygon
          points={getHexagonPoints(size.width / 2 - 10, size.width / 2, size.height / 2)}
          fill={style.primaryColor || '#ff79c6'}
          opacity={0.8}
        />
      ),
    };

    return (
      <svg width={size.width} height={size.height}>
        {shapes[content] || shapes.circle}
      </svg>
    );
  };

  // Pattern rendering
  const renderPattern = () => {
    const patternId = `pattern-${frame}`;
    
    return (
      <svg width={size.width} height={size.height}>
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            {content === 'dots' && (
              <circle cx="10" cy="10" r="2" fill={style.primaryColor || '#ff79c6'} />
            )}
            {content === 'lines' && (
              <line
                x1="0"
                y1="0"
                x2="20"
                y2="20"
                stroke={style.primaryColor || '#ff79c6'}
                strokeWidth="1"
              />
            )}
            {content === 'grid' && (
              <>
                <line
                  x1="0"
                  y1="10"
                  x2="20"
                  y2="10"
                  stroke={style.primaryColor || '#ff79c6'}
                  strokeWidth="1"
                />
                <line
                  x1="10"
                  y1="0"
                  x2="10"
                  y2="20"
                  stroke={style.primaryColor || '#ff79c6'}
                  strokeWidth="1"
                />
              </>
            )}
          </pattern>
        </defs>
        <rect
          width={size.width}
          height={size.height}
          fill={`url(#${patternId})`}
          opacity={0.3}
        />
      </svg>
    );
  };

  // Particle system rendering
  const renderParticles = () => {
    const particleCount = content.count || 20;
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = interpolate(
        frame % (fps * 2),
        [0, fps, fps * 2],
        [0, 50, 0],
        {
          easing: Easing.inOut(Easing.ease),
        }
      );
      
      const particleX = Math.cos(angle + frame * 0.01) * radius;
      const particleY = Math.sin(angle + frame * 0.01) * radius;
      
      return (
        <circle
          key={i}
          cx={size.width / 2 + particleX}
          cy={size.height / 2 + particleY}
          r={3}
          fill={style.primaryColor || '#ff79c6'}
          opacity={interpolate(
            frame % (fps * 2),
            [0, fps, fps * 2],
            [0, 1, 0],
            {
              easing: Easing.inOut(Easing.ease),
            }
          )}
        />
      );
    });

    return (
      <svg width={size.width} height={size.height}>
        {particles}
      </svg>
    );
  };

  // Wave animation rendering
  const renderWave = () => {
    const wavePoints = Array.from({ length: 50 }, (_, i) => {
      const x = (i / 49) * size.width;
      const y = size.height / 2 + 
        Math.sin((i / 10) + (frame / fps) * 2) * 30 *
        Math.sin((frame / fps) * 0.5);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={size.width} height={size.height}>
        <polyline
          points={wavePoints}
          fill="none"
          stroke={style.primaryColor || '#ff79c6'}
          strokeWidth="3"
          opacity={0.8}
        />
      </svg>
    );
  };

  // Logo rendering (placeholder)
  const renderLogo = () => {
    return (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: style.primaryColor || '#ff79c6',
          fontFamily: style.fontFamily || 'Inter, system-ui, sans-serif',
          border: `3px solid ${style.primaryColor || '#ff79c6'}`,
          borderRadius: 8,
          opacity: progress,
        }}
      >
        {content.text || 'LOGO'}
      </div>
    );
  };

  // Helper functions
  const getMorphPath = (progress: number) => {
    const shapes = [
      'circle(50% at 50% 50%)',
      'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    ];
    
    const currentIndex = Math.floor(progress * shapes.length);
    return shapes[currentIndex % shapes.length];
  };

  const getHexagonPoints = (radius: number, centerX: number, centerY: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: x - size.width / 2,
        top: y - size.height / 2,
        width: size.width,
        height: size.height,
        opacity: progress,
        ...getAnimationStyle(),
      }}
    >
      {renderGraphic()}
    </div>
  );
};