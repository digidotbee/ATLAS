import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Served from https://digidotbee.github.io/atlas/
export default defineConfig({
  base: '/atlas/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
