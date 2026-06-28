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
        // ── HR Console ──────────────────────────────────────────
        'hr-primary': '#a855f7',
        'hr-primary-glow': '#c084fc',
        'accent-cyan': '#06b6d4',
        'accent-magenta': '#db2777',
        'background-dark': '#050508',
        'surface-dark-hr': 'rgba(20, 20, 25, 0.6)',
        'surface-light': 'rgba(255, 255, 255, 0.05)',
        'border-neon': 'rgba(168, 85, 247, 0.5)',
        'text-main': '#f0f0f5',
        'text-muted': '#94a3b8',
        success: '#22d3ee',
        warning: '#f472b6',
        
        // ── Dynamic Variables ──────────────────────────────────
        'app': 'var(--bg-app)',
        'panel': 'var(--bg-panel)',
        'panel-border': 'var(--border-panel)',
        'panel-border-hover': 'var(--border-panel-hover)',
        'content': 'var(--text-primary)',
        'content-muted': 'var(--text-secondary)',
        'panel-hover': 'var(--hover-panel)',
      },
      borderColor: {
        'panel': 'var(--border-panel)',
        'panel-hover': 'var(--border-panel-hover)',
      },
      boxShadow: {
        'primary-sm': '0 1px 3px 0 rgba(79,70,229,.4)',
        'primary':    '0 4px 14px 0 rgba(79,70,229,.35)',
        'primary-lg': '0 8px 24px 0 rgba(79,70,229,.4)',
        'neon-card': '0 0 10px rgba(168, 85, 247, 0.15), inset 0 0 1px rgba(168, 85, 247, 0.2)',
        'neon-cyan': '0 0 10px rgba(6, 182, 212, 0.3)',
        'neon-magenta': '0 0 10px rgba(219, 39, 119, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
        'glass-gradient': 'linear-gradient(145deg, rgba(30, 30, 40, 0.7) 0%, rgba(10, 10, 15, 0.8) 100%)',
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
