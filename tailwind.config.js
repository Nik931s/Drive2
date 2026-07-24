/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1C1B18',
        inkSoft: '#55524A',
        concrete: '#EDEAE3',
        concreteDark: '#DAD5C9',
        chrome: '#B8BCC0',
        amber: '#F4A81D',
        amberDeep: '#C9840F',
        green: '#2E5339',
        greenLight: '#3C6B4A',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
