import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "dark-bg": "#121212",
        "dark-surface": "#1E1E1E",
        "dark-border": "#333333",
        accent: "#5C6BC0",
        "accent-hover": "#3F51B5",
        success: "#4CAF50",
        danger: "#F44336",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      fontSize: {
        code: "1.8rem",
      },
    },
  },
  plugins: [],
};
export default config;
