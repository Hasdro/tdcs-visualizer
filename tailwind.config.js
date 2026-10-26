const FAMILIES = [
  'slate', 'cyan', 'sky', 'amber', 'rose', 'red', 'emerald', 'green', 'orange', 'violet',
  'indigo', 'purple', 'yellow', 'teal', 'lime', 'fuchsia', 'blue', 'pink'
];
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

// Palette shades resolve through CSS variables so html.light can remap them
// (see scripts/build-theme.mjs and src/theme.css).
const themed = Object.fromEntries(
  FAMILIES.map((family) => [
    family,
    Object.fromEntries(SHADES.map((shade) => [shade, `rgb(var(--${family}-${shade}) / <alpha-value>)`]))
  ])
);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'html:not(.light)'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['13px', '18px'],
        sm: ['15px', '21px'],
        base: ['16.5px', '24px']
      },
      colors: {
        ...themed,
        white: 'rgb(var(--white) / <alpha-value>)',
        // Surfaces from app background (0) to floating panels (3).
        ink: {
          0: 'rgb(var(--ink-0) / <alpha-value>)',
          1: 'rgb(var(--ink-1) / <alpha-value>)',
          2: 'rgb(var(--ink-2) / <alpha-value>)',
          3: 'rgb(var(--ink-3) / <alpha-value>)'
        },
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
