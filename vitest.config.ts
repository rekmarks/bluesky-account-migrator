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
        lines: 73.56,
        functions: 68.13,
        statements: 73.72,
        branches: 54.67,
      },
    },
  },
});
