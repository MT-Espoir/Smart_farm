module.exports = {
  content: [
    './website/src/**/*.{js,jsx,ts,tsx}',
    './website/public/index.html',
  ],
  theme: {
    extend: {
        fontFamily: {
          Roboto: ['Roboto', 'sans-serif']
        },
        colors: {
            mint: '#E8FFE8',
        }
    },
  },
  plugins: [],
}
