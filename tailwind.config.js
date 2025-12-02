/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#0088cc',
          lightBlue: '#64b5ef',
          darkBlue: '#006699',
          bg: '#ffffff',
          darkBg: '#0f0f0f',
          gray: '#8e8e93',
          lightGray: '#f2f2f7',
        }
      }
    },
  },
  plugins: [],
}
