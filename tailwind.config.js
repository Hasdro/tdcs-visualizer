/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#070B12',
          panel: '#0F1623',
          panelHeader: '#131B2C',
          border: '#1E293B',
          borderLight: '#334155',
          anode: '#FF4D4D',
          anodeGlow: '#FF2A2A',
          cathode: '#00D2FF',
          cathodeGlow: '#00B4D8',
          accent: '#38BDF8',
          success: '#10B981',
          warning: '#F59E0B',
          textMuted: '#94A3B8',
          textDim: '#64748B',
        }
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-anode': '0 0 15px rgba(255, 77, 77, 0.45)',
        'glow-cathode': '0 0 15px rgba(0, 210, 255, 0.45)',
        'glow-cyan': '0 0 20px rgba(56, 189, 248, 0.35)',
      }
    },
  },
  plugins: [],
};
