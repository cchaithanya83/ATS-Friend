// tailwind.config.js
module.exports = {
  darkMode: "class", // Enable class strategy
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Add custom colors, animations, etc. here if needed
      colors: {
        primary: {
          // Example primary color palette
          light: "#3b82f6", // blue-500
          DEFAULT: "#2563eb", // blue-600
          dark: "#1d4ed8", // blue-700
        },
        secondary: {
          // Example secondary color palette
          light: "#f472b6", // pink-400
          DEFAULT: "#ec4899", // pink-500
          dark: "#db2777", // pink-600
        },
        // Define specific background/text colors for light/dark if needed
        // Often handled directly with dark: prefix in components
        "light-bg": "#ffffff",
        "dark-bg": "#111827", // gray-900
        "light-text": "#1f2937", // gray-800
        "dark-text": "#f3f4f6", // gray-100
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
