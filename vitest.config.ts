import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'automatic'
  },
  resolve: {
    alias: {
      '@domain': path.resolve(import.meta.dirname, 'packages/shared/src/domain'),
      '@data': path.resolve(import.meta.dirname, 'packages/shared/src/data'),
      '@infra': path.resolve(import.meta.dirname, 'apps/web/src/infrastructure'),
      '@components': path.resolve(import.meta.dirname, 'apps/web/src/components'),
      '@assets': path.resolve(import.meta.dirname, 'apps/web/src/assets')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['apps/web/src/**/*.test.{ts,tsx}', 'packages/shared/src/**/*.test.{ts,tsx}', 'apps/api/src/**/*.test.ts']
  }
});