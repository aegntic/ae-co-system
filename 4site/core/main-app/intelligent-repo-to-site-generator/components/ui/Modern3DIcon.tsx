import React from 'react';
import { motion } from 'framer-motion';

interface Modern3DIconProps {
  size?: number;
  className?: string;
}

export const Modern3DIcon: React.FC<Modern3DIconProps> = ({ size = 80, className = '' }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FFA000', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#FFD700', stopOpacity: 0.3 }} />
          </linearGradient>
          <filter id="shadow3d">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* 3D cube representing the "4" shape */}
        <g filter="url(#shadow3d)">
          {/* Back face */}
          <path
            d="M30 40 L50 20 L90 20 L70 40 Z"
            fill="url(#grad1)"
            opacity="0.7"
          />
          
          {/* Right face */}
          <path
            d="M70 40 L90 20 L90 80 L70 100 Z"
            fill="#FFA000"
            opacity="0.8"
          />
          
          {/* Front face - styled as "4" */}
          <motion.g
            animate={{
              rotateY: [0, 5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Main vertical of "4" */}
            <rect
              x="30"
              y="40"
              width="20"
              height="60"
              fill="url(#grad1)"
              rx="2"
            />
            
            {/* Horizontal bar of "4" */}
            <rect
              x="30"
              y="60"
              width="40"
              height="20"
              fill="url(#grad1)"
              rx="2"
            />
            
            {/* Right vertical of "4" */}
            <rect
              x="50"
              y="20"
              width="20"
              height="80"
              fill="url(#grad1)"
              rx="2"
            />
          </motion.g>

          {/* Top highlights for 3D effect */}
          <path
            d="M30 40 L50 20 L70 20 L50 40 Z"
            fill="url(#grad2)"
            opacity="0.5"
          />
          
          {/* Modern minimalist accent lines */}
          <motion.line
            x1="75"
            y1="30"
            x2="85"
            y2="30"
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              opacity: [0.3, 1, 0.3],
              x2: [85, 90, 85]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.line
            x1="75"
            y1="40"
            x2="80"
            y2="40"
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{
              opacity: [0.3, 1, 0.3],
              x2: [80, 85, 80]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </g>

        {/* Floating accent dots */}
        <motion.circle
          cx="95"
          cy="25"
          r="2"
          fill="#FFD700"
          animate={{
            y: [0, -5, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.circle
          cx="100"
          cy="35"
          r="1.5"
          fill="#FFA000"
          animate={{
            y: [0, -3, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </svg>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};