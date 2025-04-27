/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./website/src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Roboto: ['Roboto', 'sans-serif']
      },
      colors: {
        mint: "#E8FFE8",
        dark_green: "#136A19"
      }
    },
  },
  plugins: [],
}

