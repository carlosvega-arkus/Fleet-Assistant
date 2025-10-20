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
        'gradient-arkus': 'linear-gradient(140deg, #ff2a68 0%, #a72aff 50%, #2a69ff 100%)',
        'gradient-arkus-soft': 'linear-gradient(135deg, #ff2a68 0%, #a72aff 50%, #2a69ff 100%)',
        // Independent gradient for section title icons (different angle)
        'gradient-section-icon': 'linear-gradient(90deg,#ff2a68 0%, #a72aff 50%, #2a69ff 100%)',
      },
    },
  },
  plugins: [],
};
