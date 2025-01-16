import { describe, expect, it, vi } from 'vitest';
import yargs from 'yargs';

import { cli } from './cli.js';
import type { Commands } from './commands/index.js';

vi.mock('yargs', () => {
  // Proxy whose every property is a self-returning function,
  // except for "parseAsync", which returns a promise.
  const proxy: unknown = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'parseAsync') {
          return async () => Promise.resolve();
        }
        return () => proxy;
      },
      apply: () => proxy,
    },
  );
  return {
    default: vi.fn(() => proxy),
  };
});

// Mock yargs/helpers
vi.mock('yargs/helpers', () => ({
  hideBin: vi.fn((args) => args.slice(2)),
}));

// Coverage smoke test
describe('cli', () => {
  // @ts-expect-error
  const mockCommands: Commands = [{ name: 'foo' }];

  it('should initialize yargs with correct configuration', async () => {
    const argv = ['node', 'script.js', 'test'];
    await cli(argv, mockCommands);

    expect(vi.mocked(yargs)).toHaveBeenCalledTimes(1);
  });
});
