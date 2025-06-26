/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#030303',
        surface: '#0C0C0E',
        accent: '#161618',
        graphite: '#232326',
        gold: '#D4AF37',
        silver: '#9CA3AF',
        text: {
          primary: '#F8F8F8',
          secondary: '#A1A1AA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4rem', { lineHeight: '1.1' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1' }],
        'display': ['2.5rem', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-up': 'fadeUp 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'premium-dark': 'linear-gradient(180deg, var(--tw-gradient-stops))'
      }
    },
  },
  plugins: [],
};