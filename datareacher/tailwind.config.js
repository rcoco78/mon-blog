/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f1ea',
        cream: '#fbfaf6',
        ink: '#1a1916',
        mute: '#6b6560',
        line: '#e4dfd4',
        pine: '#1c3d32',
        pineHover: '#152e26',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      maxWidth: {
        site: '68rem',
      },
    },
  },
  plugins: [],
}
