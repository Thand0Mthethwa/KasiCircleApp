/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        kasi: {
          green: '#341e33',
          'green-light': '#f0e5eb',
          'green-dark': '#391a38',
          orange: '#94600c',
          'orange-light': '#fff0c9',
          cream: '#faf6ee',
          surface: '#fffaf3',
          sage: '#eee3e8',
        },
        neutral: {
          900: '#341e33',
          800: '#391a38',
          700: '#503b4d',
          600: '#705f66',
          500: '#705f66',
          400: '#705f66',
          300: '#a68e9b',
          200: '#dbccd2',
          100: '#f0e5eb',
          50: '#faf6ee',
        }
      },
      borderRadius: {
        'lg': '11px',
        'xl': '13px',
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Bricolage Grotesque Variable', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['32px', { lineHeight: '1.2' }],
      },
      spacing: {
        'gutter': '16px',
        'gutter-lg': '20px',
      }
    },
  },
  plugins: [],
}
