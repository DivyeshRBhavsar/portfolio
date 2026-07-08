import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#081820',
          900: '#0B1F2A',
          800: '#122C3A',
          700: '#1B3E4F',
        },
        teal: {
          400: '#4FD1C5',
          500: '#2EBFB2',
          600: '#1F9A8F',
          700: '#177C74',
        },
        amber: {
          400: '#E8A94C',
        },
        ink: {
          100: '#F4F6F5',
          300: '#C7D2D6',
          500: '#7C93A0',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      keyframes: {
        caret: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        typeline: {
          '0%': { width: '0ch' },
          '70%': { width: '100%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        caret: 'caret 1s steps(1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
