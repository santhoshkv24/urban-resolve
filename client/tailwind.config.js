/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Modern Civic Zinc Primary ─────────────────────────
        primary:                '#18181b',
        'primary-hover':        '#27272a',
        'primary-dark':         '#09090b',
        'primary-container':    '#f4f4f5',
        'on-primary':           '#ffffff',
        'on-primary-container': '#09090b',

        // ── Digital Azure Accent ──────────────────────────────
        secondary:                '#0284c7',
        'secondary-hover':        '#0369a1',
        'secondary-container':    '#e0f2fe',
        'on-secondary':           '#ffffff',
        'on-secondary-container': '#075985',

        // ── Surfaces ─────────────────────────────────────────
        background:                   '#fafafa',
        surface:                      '#ffffff',
        'surface-bright':             '#ffffff',
        'surface-container-lowest':   '#ffffff',
        'surface-container-low':      '#f4f4f5',
        'surface-container':          '#e4e4e7',
        'surface-container-high':     '#d4d4d8',
        'surface-container-highest':  '#a1a1aa',
        'surface-dim':                '#f1f1f1',
        'surface-variant':            '#f4f4f5',
        'surface-tint':               '#18181b',

        // ── On-Surface Text ───────────────────────────────────
        'on-surface':          '#09090b',
        'on-surface-variant':  '#52525b',
        'inverse-surface':     '#18181b',
        'inverse-on-surface':  '#fafafa',
        'inverse-primary':     '#a1a1aa',

        // ── Outline / Border ──────────────────────────────────
        outline:           '#d4d4d8',
        'outline-variant': '#e4e4e7',

        // ── Status / Semantic ─────────────────────────────────
        error:                '#e11d48',
        'error-container':    '#fff1f2',
        'on-error':           '#ffffff',
        'on-error-container': '#9f1239',

        // ── Tertiary ──────────────────────────────────────────
        tertiary:                '#d97706',
        'tertiary-container':    '#fef3c7',
        'on-tertiary':           '#ffffff',
        'on-tertiary-container': '#92400e',
      },

      fontFamily: {
        display: ['Space Grotesk', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'sans-serif'],
        body:    ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'sans-serif'],
        mono:    ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },

      boxShadow: {
        'ambient':      '0 4px 24px 0 rgba(13, 148, 136, 0.08), 0 1px 4px 0 rgba(0,0,0,0.04)',
        'ambient-sm':   '0 2px 10px 0 rgba(0, 0, 0, 0.06)',
        'ambient-lg':   '0 12px 48px 0 rgba(13, 148, 136, 0.12), 0 4px 16px 0 rgba(0,0,0,0.06)',
        'glow':         '0 0 20px rgba(13, 148, 136, 0.25)',
        'glow-lg':      '0 0 40px rgba(13, 148, 136, 0.3)',
        'glow-blue':    '0 0 30px rgba(2, 132, 199, 0.35)',
        'inner-soft':   'inset 0 1px 4px rgba(0,0,0,0.06)',
        'glass':        '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
        'card-hover':   '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      animation: {
        'aurora':         'auroraShift 15s ease infinite',
        'shimmer-text':   'shimmerText 3s linear infinite',
        'spin-slow':      'spin 3s linear infinite',
        'fade-in':        'fadeIn 0.4s ease-out',
        'fade-up':        'fadeUp 0.4s ease-out',
        'fade-down':      'fadeDown 0.3s ease-out',
        'slide-in-left':  'slideInLeft 0.35s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'float':          'float 6s ease-in-out infinite',
        'pulse-soft':     'pulseSoft 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'ping-slow':      'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'count-up':       'countUp 0.6s ease-out forwards',
        'scale-in':       'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'beam':           'beam 8s linear infinite',
        'spotlight':      'spotlight 2s ease forwards',
        'gradient-x':     'gradientX 4s ease infinite',
        'border-beam':    'borderBeam 4s linear infinite',
        'glow-pulse':     'glowPulse 3s ease-in-out infinite',
        'text-flicker':   'textFlicker 3s ease-in-out infinite',
        'fade-up-fill':   'fadeUp 0.5s ease-out both',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        beam: {
          '0%':   { transform: 'rotate(0deg) translateX(-50%)' },
          '100%': { transform: 'rotate(360deg) translateX(-50%)' },
        },
        spotlight: {
          '0%':   { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        borderBeam: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(2, 132, 199, 0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(2, 132, 199, 0.5), 0 0 80px rgba(2, 132, 199, 0.2)' },
        },
        textFlicker: {
          '0%, 100%': { opacity: '1' },
          '92%':      { opacity: '1' },
          '93%':      { opacity: '0.8' },
          '94%':      { opacity: '1' },
          '95%':      { opacity: '0.9' },
          '96%':      { opacity: '1' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      backgroundImage: {
        'gradient-civic':      'linear-gradient(135deg, #020617 0%, #0369a1 50%, #0ea5e9 100%)',
        'gradient-civic-soft': 'linear-gradient(135deg, #f4f4f5 0%, #e0f2fe 100%)',
        'gradient-dark':       'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
        'gradient-hero':       'radial-gradient(ellipse at top, #0284c7 0%, #18181b 60%, #09090b 100%)',
        'shimmer-gradient':    'linear-gradient(90deg, transparent 0%, rgba(24, 24, 27, 0.05) 50%, transparent 100%)',
        'mesh-gradient':       'radial-gradient(at 40% 20%, #0284c7 0px, transparent 50%), radial-gradient(at 80% 0%, #18181b 0px, transparent 50%), radial-gradient(at 0% 50%, #0369a1 0px, transparent 50%)',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
