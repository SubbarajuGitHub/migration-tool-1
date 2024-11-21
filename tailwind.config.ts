import type { Config } from "tailwindcss";
const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "loader-spinner": "#0CB16D",
        "light-grayish-blue": "#E2E8F0",
        "black": "#000000",
        "slate-gray": "#666666",
        "foggy-gray":"#9999994D",
        "light-grayish-lavender": "#CDCDD6"
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;
