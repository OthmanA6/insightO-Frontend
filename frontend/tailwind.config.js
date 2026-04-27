/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // ── insightO Brand Palette ──────────────────────────────
        primary: {
          DEFAULT: '#4f46e5',
          hover:   '#4338ca',
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // ── Backgrounds ─────────────────────────────────────────
        'bg-light':    '#f8fafc',
        'bg-dark':     '#020617',
        // ── Surfaces (dark mode cards / panels) ─────────────────
        'surface-dark':    '#0f172a',
        'surface-highlight': '#1e293b',
      },
      boxShadow: {
        'primary-sm': '0 1px 3px 0 rgba(79,70,229,.4)',
        'primary':    '0 4px 14px 0 rgba(79,70,229,.35)',
        'primary-lg': '0 8px 24px 0 rgba(79,70,229,.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'zoom-in': {
          from: { opacity: '0', transform: 'scale(0.92) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
      },
      animation: {
        'fade-in':  'fade-in 200ms ease-out both',
        'zoom-in':  'zoom-in 220ms cubic-bezier(0.16,1,0.3,1) both',
        'fade-out': 'fade-out 150ms ease-in both',
      },
    },
  },
  plugins: [],
}
