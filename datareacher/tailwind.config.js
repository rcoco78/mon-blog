/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fffdf9',
        cream: '#ffffff',
        wash: '#f6e5cd',
        ink: '#230a44',
        mute: '#6a6274',
        line: '#e3ddeb',
        pine: '#230a44',
        pineHover: '#492256',
        plum: '#492256',
        sage: '#6d9097',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '68rem',
      },
    },
  },
  plugins: [],
}
