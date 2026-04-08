/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0A0A0F", card: "#111118", hover: "#18181F" },
        accent: { yellow: "#E8FF5A", cyan: "#5AF0FF", pink: "#FF5A8A", green: "#5AFF8C", red: "#FF5A5A" },
        border: { DEFAULT: "#1E1E28", light: "#2A2A36" },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
