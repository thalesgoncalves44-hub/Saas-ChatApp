import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B00',
          light: '#FF8C00',
          dark: '#E55A00',
          50: '#fff3e6',
          100: '#ffe0b3',
          200: '#ffcc80',
          300: '#ffb347',
          400: '#ff9900',
          500: '#FF6B00',
          600: '#e55a00',
          700: '#cc4400',
          800: '#b23300',
          900: '#992200',
        },
        dark: {
          DEFAULT: '#0f0f1a',
          50: '#1a1a2e',
          100: '#16213e',
          200: '#0d1b2a',
          300: '#1e1e35',
          400: '#252540',
          500: '#2d2d4f',
          card: '#1a1a2e',
          border: '#2d2d4f',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
