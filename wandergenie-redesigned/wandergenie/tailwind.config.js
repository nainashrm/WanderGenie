/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        forest: { DEFAULT: '#1a2e1a', light: '#253825', dark: '#111e11' },
        sage: { DEFAULT: '#4a7c59', light: '#6a9e78', dark: '#2e5c3a' },
        sand: { DEFAULT: '#e8d5b0', light: '#f4ecd8', dark: '#c9b48a' },
        mist: '#f4f1ec',
        accent: { DEFAULT: '#e07b39', dark: '#c4622a' },
        charcoal: '#2a2a2a',
      },
      backgroundImage: {
        'hero-forest': 'linear-gradient(135deg, #1a2e1a 0%, #2e5c3a 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'shimmer': 'shimmer 1.8s infinite linear',
        'float': 'floatAnim 5s ease-in-out infinite',
        'spin-slow': 'spinSlow 10s linear infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        floatAnim: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        spinSlow: { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 10px 35px rgba(0,0,0,0.1)',
        'forest': '0 6px 20px rgba(26,46,26,0.3)',
      },
    },
  },
  plugins: [],
}
