/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  // Angular Material ships its own reset/normalize; Tailwind's preflight would fight it
  // (button/svg/heading resets in particular), so it stays off. We only use Tailwind for
  // spacing, layout and custom visual polish on top of Material components.
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6f4f1',
          100: '#c1e4dc',
          300: '#5cb8a4',
          500: '#00897b',
          600: '#00786c',
          700: '#00695c'
        },
        positive: '#2e7d32',
        negative: '#c62828'
      },
      borderRadius: {
        se: '12px'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)'
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif']
      }
    }
  },
  plugins: []
};
