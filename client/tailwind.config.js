/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Orbitron'", 'monospace'],
        mono: ["'Share Tech Mono'", 'monospace'],
        body: ["'Inter'", 'sans-serif'],
      },
      colors: {
        'bg-primary': '#050a0e',
        'bg-secondary': '#0b1318',
        'bg-tertiary': '#111d24',
        'border': '#1a3040',
        'accent': '#00ff88',
        'accent-dim': '#00cc6a',
        'accent2': '#00ccff',
        'accent2-dim': '#0099cc',
        'danger': '#ff4466',
        'warning': '#ffb700',
        'text-primary': '#c8e0d0',
        'text-bright': '#e8fff0',
        'text-dim': '#4a7060',
        'text-muted': '#2a4a3a',
      },
      animation: {
        'glitch': 'glitch 4s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.5s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
      },
      keyframes: {
        glitch: {
          '0%, 90%, 100%': {
            textShadow: '0 0 20px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.3), 2px 0 0 rgba(255,68,102,0.4), -2px 0 0 rgba(0,204,255,0.4)',
            transform: 'none',
          },
          '92%': {
            transform: 'translate(-3px, 1px)',
            textShadow: '4px 0 0 rgba(255,68,102,0.9), -4px 0 0 rgba(0,204,255,0.9)',
          },
          '94%': {
            transform: 'translate(3px, -1px)',
            textShadow: '-4px 0 0 rgba(255,68,102,0.9), 4px 0 0 rgba(0,204,255,0.9)',
          },
          '96%': {
            transform: 'translate(-1px, 0)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,255,136,0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(0,255,136,0.6), 0 0 50px rgba(0,255,136,0.2)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
