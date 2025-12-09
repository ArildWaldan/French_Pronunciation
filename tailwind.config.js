/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Noto Serif Georgian', 'serif'],
      },
    },
  },
  // We use a safelist pattern because the app constructs class names dynamically (e.g., `bg-${theme}-50`)
  // Tailwind's JIT engine cannot detect these dynamic strings during build time unless we explicitly safelist them.
  safelist: [
    {
      pattern: /(bg|text|border|ring)-(amber|cyan|violet|fuchsia|emerald|lime|orange|rose|blue|sky|purple|pink|red|indigo|slate)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'active', 'group-hover', 'focus'],
    },
    {
       pattern: /border-l-4/,
    }
  ],
  plugins: [],
}