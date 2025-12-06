import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for GitHub Pages to work in subdirectories
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});