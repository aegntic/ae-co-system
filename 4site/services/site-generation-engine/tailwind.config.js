
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // If using app router
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(210, 40%, 50%)',
          foreground: 'hsl(210, 40%, 98%)',
          dark: 'hsl(210, 40%, 40%)',
        },
        secondary: {
          DEFAULT: 'hsl(180, 50%, 50%)',
          foreground: 'hsl(180, 50%, 5%)',
        },
        background: 'hsl(0, 0%, 100%)', // Default for generated sites, portal might override
        foreground: 'hsl(215, 25%, 27%)',
        muted: {
          DEFAULT: 'hsl(210, 40%, 96.1%)',
          foreground: 'hsl(215.4, 16.3%, 46.9%)',
        },
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(215, 25%, 27%)',
        },
        accent: {
          DEFAULT: 'hsl(47.9,95.8%,53.1%)', /* A vibrant yellow for accents */
          foreground: 'hsl(48,95.8%,10%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84.2%, 60.2%)',
          foreground: 'hsl(0, 0%, 98%)',
        },
        // Dark theme for portal from original index.html
        slate: {
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        sky: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          900: '#082f49',
        },
        teal: {
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
        },
        emerald: {
            400: '#34d399',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0'},
          '100%': { transform: 'translateY(0)', opacity: '1'}
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        slideInUp: 'slideInUp 0.5s ease-out forwards',
      },
      // Typography styles for @tailwindcss/typography
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.slate.300'), // Default prose text color for dark bg
            a: {
              color: theme('colors.teal.400'),
              '&:hover': {
                color: theme('colors.teal.300'),
              },
            },
            h1: { color: theme('colors.sky.300') },
            h2: { color: theme('colors.sky.300') },
            h3: { color: theme('colors.sky.200') },
            strong: { color: theme('colors.slate.100') },
            code: { 
              backgroundColor: theme('colors.slate.700'), 
              color: theme('colors.sky.300'),
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontSize: '0.9em'
            },
            'code::before': { content: '""' }, // Remove backticks from inline code
            'code::after': { content: '""' },
            pre: { 
              backgroundColor: theme('colors.slate.900'), 
              color: theme('colors.slate.200'),
              padding: theme('spacing.4'),
              borderRadius: theme('spacing.md'),
              overflowX: 'auto',
            },
            'pre code': { 
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
              fontSize: '1em',
              fontWeight: 'normal', // Reset font weight for pre code
            },
            blockquote: { 
              borderLeftColor: theme('colors.sky.500'),
              color: theme('colors.slate.400'),
            },
            'ul > li::marker': { backgroundColor: theme('colors.sky.400') }, // For dark bg
          },
        },
        // Define variants like prose-invert if needed for light backgrounds on generated sites
        invert: { // Example for light background generated sites
            css: {
                color: theme('colors.foreground'),
                 a: {
                    color: theme('colors.primary.DEFAULT'),
                    '&:hover': { color: theme('colors.primary.dark') },
                },
                h1: { color: theme('colors.foreground') },
                h2: { color: theme('colors.foreground') },
                h3: { color: theme('colors.foreground') },
                strong: { color: theme('colors.foreground') },
                code: { 
                    backgroundColor: theme('colors.muted.DEFAULT'), 
                    color: theme('colors.primary.dark'),
                },
                pre: { 
                    backgroundColor: theme('colors.gray.800'), // Using tailwind gray for example
                    color: theme('colors.gray.100'),
                 },
                blockquote: { borderLeftColor: theme('colors.primary.DEFAULT') },
                'ul > li::marker': { backgroundColor: theme('colors.primary.DEFAULT') },
            }
        }
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
