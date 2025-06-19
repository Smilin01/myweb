/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        marquee: 'marquee var(--duration, 30s) linear infinite',
        'marquee-reverse': 'marquee-reverse var(--duration, 30s) linear infinite'
      },
      keyframes: {
        marquee: {
          to: { transform: 'translateX(-50%)' }
        },
        'marquee-reverse': {
          to: { transform: 'translateX(50%)' }
        }
      }
    },
  },
  plugins: [],
};