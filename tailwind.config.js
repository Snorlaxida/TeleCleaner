/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          lightBlue: '#64b5ef',
          darkBlue: '#006699',
          bg: '#ffffff',
          darkBg: '#212121',
          secondaryDarkBg: '#181818',
          gray: '#8e8e93',
          lightGray: '#f2f2f7',
          darkGray: '#2c2c2e',
          textDark: '#ffffff',
          textLight: '#000000',
          secondaryTextDark: '#aaaaaa',
          secondaryTextLight: '#707579',
        }
      }
    },
  },
  plugins: [],
}
