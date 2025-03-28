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
        primary: {
          light: '#3b82f6',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: {
          light: '#a855f7',
          DEFAULT: '#9333ea',
          dark: '#7e22ce',
        },
        dark: {
          bg: {
            primary: '#1f2937',
            secondary: '#111827',
            tertiary: '#374151',
          },
          text: {
            primary: '#f9fafb',
            secondary: '#e5e7eb',
            muted: '#9ca3af',
          },
          border: '#374151',
        },
      },
      backgroundColor: {
        light: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
        },
      },
    },
  },
  plugins: [],
};
