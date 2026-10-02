/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EDE7DA',
        ink: '#211F1B',
        ochre: '#B4823E',
        'ochre-dark': '#8F6630',
        moss: '#4B5842',
        rule: '#D8CFBC',
        card: '#F6F2E9',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        content: '1240px',
      },
    },
  },
  plugins: [],
};
