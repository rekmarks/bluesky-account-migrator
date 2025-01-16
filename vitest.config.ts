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
        lines: 82.92,
        functions: 79.34,
        statements: 83.2,
        branches: 69.78,
      },
    },
  },
});
