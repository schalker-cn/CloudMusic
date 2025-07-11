module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'black': '#252525',
        'secondBack': '#202020',
        'white': 'rgba(255, 255, 255, 0.82);'
      },
      screens: { 'sm': { 'min': '350px', 'max': '767px' } , 'max': '1900px','3xl':'1750px'},
      height: { 'main': 'calc(100vh - 3.5rem)' },
      transitionProperty: {
        'height': 'height',
        'width': 'width',
        'spacing': 'margin, padding'
      },
      width: {
        '50': '206px',
        '74': '302px',
        'xs': '240px'
      }
    }
  },
  darkMode: 'class',
  plugins: [],
  corePlugins: {
    preflight: false
  }
};
