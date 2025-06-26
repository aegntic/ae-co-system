/**
 * Aegntic.ai Universal Tailwind CSS Configuration
 * Neural-Themed Design System
 * 
 * Usage: Extend your tailwind.config.js with this configuration
 */

const aegnticConfig = {
  theme: {
    extend: {
      colors: {
        // Primary Aegntic Brand Colors
        aegntic: {
          50: '#f0f7ff',
          100: '#e0f0fe',
          200: '#bbe3fc',
          300: '#7dcdf9',
          400: '#36b4f4',
          500: '#0c9ae5',  // PRIMARY BRAND COLOR
          600: '#027bc4',
          700: '#0361a0',
          800: '#075284',
          900: '#0c446d',
          950: '#082b48',
        },
        
        // Neural Background Colors
        neural: {
          50: '#f8fafc',
          100: '#f1f5f9',  // Primary text on dark
          200: '#e2e8f0',
          300: '#cbd5e1',  // Secondary text
          400: '#94a3b8',  // Muted text
          500: '#64748b',  // Placeholder text
          600: '#475569',
          700: '#334155',  // Subtle borders
          800: '#1e293b',  // Card borders
          900: '#0f172a',  // Card backgrounds
          950: '#020617',  // PRIMARY BACKGROUND
        },

        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        
        info: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },

      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'monospace'],
        'display': ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },

      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        'neural': '0 10px 25px rgba(0, 0, 0, 0.3)',
        'neural-lg': '0 20px 50px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(12, 154, 229, 0.3)',
        'glow-lg': '0 0 30px rgba(12, 154, 229, 0.5)',
        'glow-xl': '0 0 40px rgba(12, 154, 229, 0.6)',
      },

      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },

      animation: {
        'neural-pulse': 'neural-pulse 2s ease-in-out infinite',
        'data-flow': 'data-flow 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },

      keyframes: {
        'neural-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.8',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '1',
          },
        },
        'data-flow': {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          '50%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
        },
        'fade-in': {
          'from': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scale-in': {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(12, 154, 229, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(12, 154, 229, 0.6)',
          },
        },
      },

      gradientColorStops: {
        'aegntic': '#0c9ae5',
        'aegntic-light': '#36b4f4',
        'aegntic-dark': '#027bc4',
      },

      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },

      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },

      typography: (theme) => ({
        neural: {
          css: {
            '--tw-prose-body': theme('colors.neural.300'),
            '--tw-prose-headings': theme('colors.neural.100'),
            '--tw-prose-lead': theme('colors.neural.400'),
            '--tw-prose-links': theme('colors.aegntic.400'),
            '--tw-prose-bold': theme('colors.neural.100'),
            '--tw-prose-counters': theme('colors.neural.400'),
            '--tw-prose-bullets': theme('colors.neural.600'),
            '--tw-prose-hr': theme('colors.neural.700'),
            '--tw-prose-quotes': theme('colors.neural.100'),
            '--tw-prose-quote-borders': theme('colors.neural.700'),
            '--tw-prose-captions': theme('colors.neural.400'),
            '--tw-prose-code': theme('colors.neural.100'),
            '--tw-prose-pre-code': theme('colors.neural.200'),
            '--tw-prose-pre-bg': theme('colors.neural.900'),
            '--tw-prose-th-borders': theme('colors.neural.700'),
            '--tw-prose-td-borders': theme('colors.neural.800'),
          },
        },
      }),
    },
  },

  plugins: [
    // Custom component classes
    function({ addComponents, theme }) {
      const components = {
        // Neural Card Component
        '.neural-card': {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${theme('colors.neural.800')}`,
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.neural'),
        },

        // Neural Button Component
        '.neural-button': {
          background: `linear-gradient(135deg, ${theme('colors.aegntic.500')} 0%, ${theme('colors.aegntic.600')} 100%)`,
          color: 'white',
          fontWeight: theme('fontWeight.medium'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          border: 'none',
          cursor: 'pointer',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme('boxShadow.glow'),
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.glow-lg'),
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&:disabled': {
            background: theme('colors.neural.900'),
            color: theme('colors.neural.600'),
            cursor: 'not-allowed',
            boxShadow: 'none',
          },
        },

        // Neural Button Secondary
        '.neural-button-secondary': {
          backgroundColor: theme('colors.neural.800'),
          color: theme('colors.neural.100'),
          border: `1px solid ${theme('colors.neural.700')}`,
          fontWeight: theme('fontWeight.medium'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          cursor: 'pointer',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: theme('colors.neural.700'),
            borderColor: theme('colors.aegntic.500'),
          },
        },

        // Neural Input Component
        '.neural-input': {
          backgroundColor: theme('colors.neural.900'),
          border: `1px solid ${theme('colors.neural.700')}`,
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.3'),
          color: theme('colors.neural.100'),
          transition: 'border-color 200ms ease',
          width: '100%',
          '&::placeholder': {
            color: theme('colors.neural.500'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.aegntic.500'),
            boxShadow: `0 0 0 3px rgba(12, 154, 229, 0.1)`,
          },
          '&:disabled': {
            backgroundColor: theme('colors.neural.900'),
            color: theme('colors.neural.600'),
            cursor: 'not-allowed',
          },
        },

        // Gradient Text
        '.gradient-text': {
          background: `linear-gradient(135deg, ${theme('colors.aegntic.400')} 0%, ${theme('colors.aegntic.600')} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },

        // Neural Glow Effects
        '.neural-glow': {
          boxShadow: theme('boxShadow.glow'),
        },
        '.neural-glow-hover:hover': {
          boxShadow: theme('boxShadow.glow-lg'),
        },

        // Status Indicators
        '.status-indicator': {
          width: theme('spacing.3'),
          height: theme('spacing.3'),
          borderRadius: theme('borderRadius.full'),
          animation: 'pulse 2s infinite',
        },
        '.status-indicator-success': {
          backgroundColor: theme('colors.success.400'),
        },
        '.status-indicator-warning': {
          backgroundColor: theme('colors.warning.400'),
        },
        '.status-indicator-error': {
          backgroundColor: theme('colors.error.400'),
        },
        '.status-indicator-info': {
          backgroundColor: theme('colors.info.400'),
        },
      }

      addComponents(components)
    },

    // Custom utility classes
    function({ addUtilities }) {
      const utilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        },
        '.backdrop-blur-neural': {
          backdropFilter: 'blur(8px)',
        },
        '.transition-neural': {
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }

      addUtilities(utilities)
    },
  ],

  // Dark mode configuration
  darkMode: 'class',

  // Content configuration for purging
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
}

// Export for use in projects
module.exports = aegnticConfig

// For ES6 projects
export default aegnticConfig

// Usage example:
/*
// In your tailwind.config.js:
const aegnticConfig = require('./aegntic-tailwind.config.js')

module.exports = {
  ...aegnticConfig,
  // Your additional configuration
  content: [
    ...aegnticConfig.content,
    // Your additional content paths
  ],
}
*/