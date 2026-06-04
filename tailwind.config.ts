import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        merde: {
          bg: "#0a0a0f",
          panel: "#13131a",
          border: "#23232e",
          accent: "#8b5cf6",
          accentHover: "#7c3aed",
        },
      },
    },
  },
  plugins: [],
};

export default config;
