/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lm: {
          bg: '#143824',          // Fondo verde césped profundo (como en ELNINE)
          sidebar: '#0e2518',     // Sidebar izquierda verde oscuro
          sidebarHover: '#163b26',
          card: '#12301f',        // Tarjeta central
          cardHeader: '#1a432b',  // Encabezado de liga
          rowNormal: '#143522',   // Fila normal de partido
          rowLive: '#275239',     // Fila de partido EN VIVO (verde claro distintivo de ELNINE)
          rowHover: '#1c452c',
          border: '#1e4b30',      // Bordes de división
          borderLight: '#2a6341',
          scoreBg: '#0b1d13',     // Caja oscura del marcador
          accent: '#22c55e',      // Verde vivo de acento y subrayado
          accentHover: '#16a34a',
          liveRed: '#ef4444',     // Rojo vivo de minutería
          textMuted: '#95b8a2',
          textLight: '#e8f5ec',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
