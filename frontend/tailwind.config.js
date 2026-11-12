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
          green: '#183d2d',
          'green-light': '#eaf0df',
          'green-dark': '#264e36',
          orange: '#ac623d',
          'orange-light': '#f4e6d7',
          cream: '#fbfcf5',
          surface: '#fffef8',
          sage: '#d8e8bf',
        },
        neutral: {
          900: '#20392b',
          800: '#304536',
          700: '#43533e',
          600: '#596650',
          500: '#596650',
          400: '#596650',
          300: '#c8cebc',
          200: '#e0e4d6',
          100: '#eef1e6',
          50: '#f7f8f0',
        }
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Georgia', 'Cambria', 'serif'],
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
