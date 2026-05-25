/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F5F5',
          100: '#CCF0EF',
          300: '#66C5C5',
          500: '#14919B',
          700: '#0D6E6E',
          900: '#063D3D',
        },
        accent: {
          300: '#F7C95F',
          500: '#F0A500',
          700: '#B87A00',
        },
        ink: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0A0F1C',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        shimmer:
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)',
        'shimmer-dark':
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%)',
      },
      backgroundSize: {
        shimmer: '200% 100%',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ring: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-15deg)' },
          '75%': { transform: 'rotate(15deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(20,145,155,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(20,145,155,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        ring: 'ring 0.9s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        'pulse-glow': 'pulse-glow 1.6s ease-in-out infinite',
      },
      boxShadow: {
        soft: '0 4px 14px rgba(15, 23, 42, 0.06)',
        elevated: '0 20px 40px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
