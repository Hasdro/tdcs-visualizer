import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js alone minifies to ~670 kB and cannot be split further; every
    // other chunk stays well under the default 500 kB budget.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep the large, rarely-changing 3D runtime in its own cacheable chunks.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei']
        }
      }
    }
  }
});
