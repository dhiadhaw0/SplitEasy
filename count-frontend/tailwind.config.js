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
  // Colors, radius, shadows and fonts all come from the --se-* custom properties in styles.scss
  // instead of Tailwind theme tokens, so every value stays in one place and themes (light/dark)
  // for free — no `extend` needed here.
  theme: {},
  plugins: []
};
