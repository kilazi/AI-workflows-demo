/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0f0f0f', // Deeper black for main bg
          secondary: '#1e1e1e', // Dark gray for panels
          accent: '#3b82f6', // Blue for highlights
          text: '#f3f4f6', // Light gray for text
          muted: '#9ca3af', // Muted gray
          node: {
            ecosystem: '#6366f1', // Indigo for ecosystem nodes
            utility: '#10b981', // Green for utilities
            aiTool: '#f59e0b', // Amber for AI tools
            temporal: '#ef4444', // Red for temporal
          }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
