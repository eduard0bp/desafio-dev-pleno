/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    // e2e/ contains Playwright specs (run via `npm run test:e2e`), not Vitest
    // tests — without this exclude, Vitest's default *.spec.ts glob picks
    // them up and fails because they call Playwright's test() outside of
    // the Playwright runner.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
