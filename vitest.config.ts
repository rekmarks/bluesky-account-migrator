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
        lines: 85.89,
        functions: 82.47,
        statements: 86.09,
        branches: 65.8,
      },
    },
  },
});