import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Theme colours are CSS variables (RGB triplets) set per theme on <html> in
      // app/globals.css: dawn, day, sunset, night. Every text/background pair used on
      // the site meets WCAG AA in all four (checked with a contrast script).
      colors: {
        peach: 'rgb(var(--c-peach) / <alpha-value>)', // hero band + intro overlay
        cream: 'rgb(var(--c-cream) / <alpha-value>)', // page background
        surface: 'rgb(var(--c-surface) / <alpha-value>)', // cards, bubble, inputs
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)', // body text (light at night)
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)', // secondary text
        },
        red: {
          DEFAULT: 'rgb(var(--c-red) / <alpha-value>)', // hoodie red: fills (white text), borders
          deep: 'rgb(var(--c-red-deep) / <alpha-value>)', // red for small text (links, active nav)
        },
        sun: 'rgb(var(--c-sun) / <alpha-value>)', // accent fills, always with an ink outline
        'on-sun': 'rgb(var(--c-on-sun) / <alpha-value>)', // text on sun: dark in every theme
        // Fixed dark palette for the TerminalHero card (same in every theme).
        night: {
          DEFAULT: '#141210', // TerminalHero card
          800: '#221E1B',
          700: '#3A332E',
          text: '#E7DED5',
          muted: '#ADA299',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        sticker: '4px 4px 0 0 rgb(var(--c-shadow))',
        'sticker-red': '6px 6px 0 0 rgb(var(--c-red))',
      },
      keyframes: {
        caret: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
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
