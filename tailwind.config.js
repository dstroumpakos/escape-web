/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#1A0D0D',
          dark: '#0F0707',
          card: '#2A1515',
          surface: '#3A2020',
          border: '#4A2A2A',
          red: '#FF1E1E',
          'red-hover': '#E01A1A',
          'red-light': '#FF4D4D',
          'red-glow': 'rgba(255, 30, 30, 0.3)',
          gold: '#FFD700',
          text: '#FFFFFF',
          'text-secondary': '#B0A0A0',
          'text-muted': '#6B5555',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.5s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(255, 30, 30, 0.2)' },
          '100%': { boxShadow: '0 0 40px rgba(255, 30, 30, 0.5)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
