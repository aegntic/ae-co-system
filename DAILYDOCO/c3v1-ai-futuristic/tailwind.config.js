/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4ff',
          100: '#b3deff',
          200: '#80c8ff',
          300: '#4db3ff',
          400: '#269dff',
          500: '#0088ff',
          600: '#0c79e5',
          700: '#0e6acc',
          800: '#0f5bb3',
          900: '#114c99',
          950: '#0a2f66',
        },
        neural: {
          blue: '#0c9ae5',
          purple: '#9945ff',
          pink: '#ff45a6',
          cyan: '#00ffff',
          green: '#00ff88',
        },
        dark: {
          50: '#1a1a2e',
          100: '#16213e',
          200: '#0f1729',
          300: '#0a0e1a',
          400: '#060810',
          500: '#030509',
          600: '#020307',
          700: '#010204',
          800: '#000102',
          900: '#000000',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'neural-flow': 'neural-flow 3s ease-in-out infinite',
        'hologram': 'hologram 4s ease-in-out infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' }
        },
        'glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 }
        },
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(12, 154, 229, 0.5), 0 0 40px rgba(12, 154, 229, 0.3)'
          },
          '50%': {
            'box-shadow': '0 0 30px rgba(12, 154, 229, 0.8), 0 0 60px rgba(12, 154, 229, 0.4)'
          }
        },
        'neural-flow': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'hologram': {
          '0%, 100%': {
            transform: 'rotateY(0deg) rotateX(0deg)',
            opacity: 0.9
          },
          '50%': {
            transform: 'rotateY(10deg) rotateX(5deg)',
            opacity: 1
          }
        }
      },
      backgroundImage: {
        'neural-gradient': 'linear-gradient(135deg, #0c9ae5 0%, #9945ff 50%, #ff45a6 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #0f1729 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(12, 154, 229, 0.5)',
        'neon-lg': '0 0 40px rgba(12, 154, 229, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}