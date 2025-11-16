/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          500: '#6366f1',
          700: '#4338ca'
        },
        accent: '#06b6d4'
      },
      spacing: {
        '18': '4.5rem'
      },
    },
  },
  plugins: [],
}
