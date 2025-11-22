/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Blue accent palette
        'blue-950': '#03045e',
        'blue-900': '#023e8a',
        'blue-800': '#0077b6',
        'blue-700': '#0096c7',
        'blue-600': '#00b4d8',
        'blue-500': '#48cae4',
        'blue-400': '#90e0ef',
        'blue-300': '#ade8f4',
        'blue-200': '#caf0f8',

        // Semantic colors - light mode (white bg, blue accents)
        primary: '#0077b6',
        'primary-dark': '#023e8a',
        secondary: '#00b4d8',
        accent: '#48cae4',

        // Backgrounds
        'bg-light': '#ffffff',
        'bg-dark': '#0a0a0a',
        'card-light': '#ffffff',
        'card-dark': '#1a1a1a',

        // Text
        'text-light': '#0a0a0a',
        'text-dark': '#f5f5f5',
        'text-muted-light': '#6b7280',
        'text-muted-dark': '#9ca3af'
      }
    }
  },
  plugins: []
};
