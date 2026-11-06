/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        mushaf: ["UthmanicHafs"],
      },
      colors: {
        forest: {
          DEFAULT: "#2F6E4A",
          deep: "#1E4A32",
          mid: "#3E8660",
        },
        night: "#0B1C24",
        navy: {
          DEFAULT: "#12263A",
          deep: "#0F1722",
        },
        gold: {
          DEFAULT: "#E2C56A",
          deep: "#B08D3E",
          soft: "#F8F0D4",
        },
        cream: "#F7F6F0",
        ivory: "#FCFBF7",
      },
    },
  },
  plugins: [],
};
