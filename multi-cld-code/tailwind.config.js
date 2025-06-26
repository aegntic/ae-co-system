/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-bg': 'rgb(var(--terminal-bg) / <alpha-value>)',
        'terminal-text': 'rgb(var(--terminal-text) / <alpha-value>)',
        'attention': 'rgb(var(--attention) / <alpha-value>)',
        'panel-bg': 'rgb(var(--panel-bg) / <alpha-value>)',
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out 3',
        'slide-in': 'slide-in 0.3s ease-out',
        'pop-up': 'pop-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        flash: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: 'rgb(var(--attention))' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pop-up': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.95' },
          '100%': { transform: 'scale(1.5)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

