/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'game-primary': '#34d399',
        'game-secondary': '#6366f1',
        'game-accent': '#a855f7',
        'game-bg': {
          light: '#F9FAFB',
          dark: '#111827'
        },
        'game-surface': {
          light: '#FFFFFF',
          dark: '#1F2937'
        }
      },
      animation: {
        'bounce-subtle': 'bounce 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
