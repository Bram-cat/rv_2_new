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
        // New color palette from coolors.co
        // #8ecae6, #219ebc, #023047, #ffb703, #fb8500
        primary: {
          DEFAULT: '#023047',  // Dark navy - main background
          light: '#034569',
          dark: '#011627',
        },
        secondary: {
          DEFAULT: '#219ebc',  // Medium blue
          light: '#8ecae6',    // Light blue
          dark: '#1a7a91',
        },
        background: {
          DEFAULT: '#023047',  // Dark navy background
          dark: '#011627',
          card: '#034569',
          light: '#8ecae6',
        },
        accent: {
          DEFAULT: '#ffb703',  // Golden yellow
          light: '#ffc933',
          dark: '#cc9200',
        },
        orange: {
          DEFAULT: '#fb8500',  // Orange
          light: '#fc9d33',
          dark: '#c96a00',
        },
        blue: {
          light: '#8ecae6',    // Light blue
          medium: '#219ebc',   // Medium blue
          dark: '#023047',     // Dark navy
        },
        // Semantic colors
        text: {
          primary: '#ffffff',
          secondary: '#8ecae6',
          muted: '#6bb8d4',
        },
        success: '#22c55e',
        error: '#ef4444',
        warning: '#ffb703',
      },
      fontFamily: {
        cabinet: ['CabinetGrotesk', 'sans-serif'],
        'cabinet-light': ['CabinetGrotesk-Light', 'sans-serif'],
        'cabinet-regular': ['CabinetGrotesk-Regular', 'sans-serif'],
        'cabinet-medium': ['CabinetGrotesk-Medium', 'sans-serif'],
        'cabinet-bold': ['CabinetGrotesk-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
