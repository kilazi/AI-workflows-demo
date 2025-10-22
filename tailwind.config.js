/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'n8n-dark': '#1a1a1a',
        'n8n-darker': '#0f0f0f',
        'n8n-light': '#2a2a2a',
        'n8n-primary': '#ffffff',
        'n8n-secondary': '#a0a0a0',
        'n8n-muted': '#707070',
      }
    },
  },
  plugins: [],
}
