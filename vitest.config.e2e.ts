import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    restoreMocks: true,
    include: ['test/e2e/**/*.test.ts'],
  },
});
