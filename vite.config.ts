import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base: works at https://digidotbee.github.io/ATLAS/ regardless of path casing (hash routing).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
