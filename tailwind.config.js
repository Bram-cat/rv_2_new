/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Custom color palette from coolors.co
        primary: {
          DEFAULT: '#006d77',
          dark: '#005a63',
          light: '#83c5be',
        },
        secondary: {
          DEFAULT: '#83c5be',
          dark: '#6bb3ab',
          light: '#a8d8d3',
        },
        background: {
          DEFAULT: '#edf6f9',
          dark: '#d4e8ed',
          card: '#ffffff',
        },
        accent: {
          DEFAULT: '#e29578',
          light: '#ffddd2',
          dark: '#c77a5e',
        },
        // Semantic colors
        teal: {
          900: '#006d77',
          700: '#008b8b',
          500: '#83c5be',
          300: '#a8d8d3',
          100: '#d4ebe8',
        },
        peach: {
          100: '#ffddd2',
          300: '#ffcab8',
          500: '#e29578',
          700: '#c77a5e',
        },
      },
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
