/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ==============================================
        // TEMA ARKAMON - modifica qui per cambiare i colori in tutto il gioco
        // I nomi diventano classi Tailwind: bg-arka-bg, text-arka-accent, ecc.
        // ==============================================
        arka: {
          bg: '#0f172a',                  // bg-arka-bg
          surface: '#1e293b',             // bg-arka-surface
          'surface-hover': '#334155',     // bg-arka-surface-hover
          accent: '#f59e0b',              // bg-arka-accent
          'accent-hover': '#fbbf24',
          danger: '#dc2626',
          success: '#16a34a',
          text: '#f1f5f9',                // text-arka-text
          'text-muted': '#94a3b8',        // text-arka-text-muted
          border: '#475569',              // border-arka-border
        },
        // Colori per i tipi di pokémon - usati nelle classi tipo bg-tipo-fuoco
        tipo: {
          normale: '#a8a878',
          elettro: '#f8d030',
          fuoco: '#f08030',
          terra: '#e0c068',
          acqua: '#6890f0',
          erba: '#78c850',
          oscurita: '#705848',
          psico: '#f85888',
        },
      },
      fontFamily: {
        // Aggiungi font custom qui (poi importali in index.css)
        game: ['"Press Start 2P"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
        'flash': 'flash 0.3s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
