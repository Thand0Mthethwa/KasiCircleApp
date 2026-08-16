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
          green: '#2D9D78',
          'green-light': '#E8F5F1',
          'green-dark': '#1F6B54',
          orange: '#FF9800',
          'orange-light': '#FFE0B2',
        },
        neutral: {
          900: '#1A1A1A',
          800: '#2A2A2A',
          700: '#3A3A3A',
          600: '#666666',
          500: '#888888',
          400: '#AAAAAA',
          300: '#D0D0D0',
          200: '#E8E8E8',
          100: '#F5F5F5',
          50: '#FAFAFA',
        }
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
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
