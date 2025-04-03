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
        lines: 85.39,
        functions: 82.29,
        statements: 85.6,
        branches: 65.56,
      },
    },
  },
});
