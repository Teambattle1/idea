/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        battle: {
          black: '#0a0a0a',
          dark: '#121212',
          grey: '#2a2a2a',
          orange: '#ff6600',
          orangeLight: '#ff8533',
          white: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};
