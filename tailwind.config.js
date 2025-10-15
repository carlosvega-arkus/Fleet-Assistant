/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arkus: {
          scarlet: '#F70D3F',
          blue: '#0055FF',
          fuchsia: '#EC10A9',
          black: '#181818',
          gray: '#808080',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Widescreen', 'Impact', 'Arial Black', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-arkus': 'linear-gradient(90deg, #F70D3F 0%, #EC10A9 50%, #0055FF 100%)',
        'gradient-arkus-soft': 'linear-gradient(135deg, rgba(247,13,63,0.1) 0%, rgba(236,16,169,0.1) 50%, rgba(0,85,255,0.1) 100%)',
      },
    },
  },
  plugins: [],
};
