/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
    './src/**/*.{md,mdx}',
  ],
  safelist: [
    // Preserve dynamic classes that might be generated
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    'animate-float',
    'animate-float-delayed',
    'scale-100',
    'scale-105',
    'opacity-0',
    'opacity-100',
    // Preserve grid and spacing utilities
    'grid',
    'grid-cols-4',
    'col-span-1',
    'col-span-3',
    'space-y-1',
    'space-y-4',
    'min-h-screen',
    'bg-gradient-to-br',
    'from-indigo-900',
    'via-purple-900',
    'to-black',
    'backdrop-blur-md',
    'backdrop-blur-xl',
    // Preserve color variations
    'bg-blue-400/30',
    'bg-purple-400/25',
    'bg-pink-400/35',
    'bg-indigo-400/40',
    'bg-teal-400/25',
    'bg-cyan-400/30',
    'bg-yellow-400/25',
    'bg-emerald-400/35',
    // Preserve text colors
    'text-white',
    'text-white/70',
    'text-white/80',
    'text-blue-300',
    'text-green-300',
    'text-purple-300',
    'text-pink-300',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-20px) rotate(1deg)' },
          '66%': { transform: 'translateY(10px) rotate(-1deg)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg) scale(1)' },
          '50%': { transform: 'translateY(-30px) rotate(2deg) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
