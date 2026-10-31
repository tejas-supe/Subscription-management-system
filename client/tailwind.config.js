/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#171B19',
          surface: '#1E2321',
          hover: '#242A27',
          light: '#2E3532',
        },
        forest: {
          DEFAULT: '#263D32',
          light: '#335042',
          dark: '#1B2C24',
        },
        chartreuse: {
          DEFAULT: '#C5F36A',
          hover: '#B5E655',
          light: '#D7F792',
          glow: 'rgba(197, 243, 106, 0.15)',
        },
        ivory: {
          DEFAULT: '#F5F3EA',
          dark: '#EBE7D8',
          light: '#FCFBF7',
        },
        sage: {
          DEFAULT: '#A5B5A4',
          light: '#C2CEC1',
          dark: '#869885',
        },
        slategrey: {
          DEFAULT: '#737C77',
          light: '#919B95',
          dark: '#58605C',
        },
        bordergrey: {
          DEFAULT: '#DDE1D8',
          light: '#EBEFE7',
          dark: '#C8CCC3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(23, 27, 25, 0.05), 0 1px 2px rgba(23, 27, 25, 0.03)',
        'card': '0 4px 12px rgba(23, 27, 25, 0.04), 0 1px 3px rgba(23, 27, 25, 0.03)',
        'elevated': '0 10px 25px -3px rgba(23, 27, 25, 0.08), 0 4px 6px -2px rgba(23, 27, 25, 0.04)',
        'glow-chartreuse': '0 0 15px rgba(197, 243, 106, 0.35)',
      }
    },
  },
  plugins: [],
}
