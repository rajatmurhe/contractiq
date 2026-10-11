import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Coverage instrumentation is slower on translated (Rosetta) Node runtimes.
    testTimeout: 15000,
    setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'json-summary'], include: ['src/features/review/**/*.{ts,tsx}'] },
  },
});
