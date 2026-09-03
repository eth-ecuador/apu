import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // APU Brand Colors
        brand: {
          violet: '#493FEE',
          'violet-tint': '#958FEC',
          pressed: '#372DD6',
        },
        apu: {
          ink: '#131313',
          paper: '#F5F5F5',
          wash: '#EDECEFC',
          borde: '#E4E3EB',
          tenue: '#65C7A',
        },
        success: '#1F9E6E',
        warning: '#C77A16',
        error: '#D7263D',
      },
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
