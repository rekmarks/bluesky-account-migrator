import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      enabled: true,
      include: ['src/**/*'],
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        autoUpdate: true,
        lines: 85.54,
        functions: 82.82,
        statements: 85.74,
        branches: 64.81,
      },
    },
  },
});