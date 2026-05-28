/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0a0a0f",
          card: "#16161f",
          border: "#2a2a3a",
          tech: "#6c63ff",
          re: "#ff6b6b",
          training: "#43e97b",
          coaching: "#f7b731",
          lightCard: "#f8f9fa",
          lightBorder: "#e9ecef"
        }
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Syne", "sans-serif"]
      }
    },
  },
  plugins: [],
}
