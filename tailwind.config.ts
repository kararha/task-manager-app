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
        neu: {
          base: '#E0E5EC',
          text: '#2D3748',
          accent: '#4299E1'
        }
      },
      boxShadow: {
        'neu-flat': '9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)',
        'neu-pressed': 'inset 6px 6px 10px rgba(163,177,198,0.7), inset -6px -6px 10px rgba(255,255,255,0.8)',
        'neu-sm': '4px 4px 8px rgba(163,177,198,0.5), -4px -4px 8px rgba(255,255,255,0.4)',
      }
    },
  },
  plugins: [],
};
export default config;
