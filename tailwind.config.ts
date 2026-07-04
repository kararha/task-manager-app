import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neu: {
          base: 'var(--neu-base)',
          text: 'var(--neu-text)',
          accent: 'var(--neu-accent)'
        }
      },
      boxShadow: {
        'neu-flat': 'var(--neu-flat-shadow)',
        'neu-pressed': 'var(--neu-pressed-shadow)',
        'neu-sm': 'var(--neu-sm-shadow)',
      }
    },
  },
  plugins: [],
};
export default config;
