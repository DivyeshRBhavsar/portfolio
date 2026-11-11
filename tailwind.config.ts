import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Bright theme. Every text/background pair used on the site meets WCAG AA:
      // ink on cream 16.2:1, ink-muted on peach 6.5:1, red-deep on cream 6.2:1,
      // white on red 4.7:1, ink on sun 11:1.
      colors: {
        peach: '#F6DDC3', // intro overlay + hero band
        cream: '#FFF5EA', // page background
        surface: '#FFFFFF', // cards, bubble, inputs
        ink: {
          DEFAULT: '#1A1A1A', // body text
          muted: '#5A4A3F', // secondary text
        },
        red: {
          DEFAULT: '#E2231A', // hoodie red: fills (white text), borders, focus ring, large text
          deep: '#B8150E', // red for small text (links, active nav)
        },
        sun: '#FFC531', // fresh accent: buttons and tags, always with an ink outline
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
        sticker: '4px 4px 0 0 #1A1A1A',
        'sticker-red': '6px 6px 0 0 #E2231A',
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
