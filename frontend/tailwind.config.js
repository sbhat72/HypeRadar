/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        'hype-green': 'var(--hype-green)',
        'hype-green-bg': 'var(--hype-green-bg)',
        'hype-red': 'var(--hype-red)',
        'hype-red-bg': 'var(--hype-red-bg)',
        'hype-blue': 'var(--hype-blue)',
        'hype-blue-bg': 'var(--hype-blue-bg)',
        'hype-orange': 'var(--hype-orange)',
        'hype-orange-bg': 'var(--hype-orange-bg)',
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
        subtle: 'var(--border-subtle)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'ticker-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'price-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 8px 0 var(--hype-green)' },
          '50%': { boxShadow: '0 0 20px 4px var(--hype-green)' },
        },
        'glow-red': {
          '0%, 100%': { boxShadow: '0 0 8px 0 var(--hype-red)' },
          '50%': { boxShadow: '0 0 20px 4px var(--hype-red)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'ticker-scroll': 'ticker-scroll 28s linear infinite',
        'price-pulse': 'price-pulse 2s ease-in-out infinite',
        'glow-green': 'glow-green 2.5s ease-in-out infinite',
        'glow-red': 'glow-red 2.5s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'blink': 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
