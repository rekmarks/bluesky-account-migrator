import { describe, expect, it, vi, afterEach } from 'vitest';

import { cli } from './cli.js';
import { commands } from './commands/index.js';

vi.mock('./cli.js', () => ({
  cli: vi.fn(),
}));

describe('main', () => {
  afterEach(() => {
    vi.resetModules();
    process.exitCode = undefined;
  });

  it('should call cli with process.argv and commands', async () => {
    vi.mocked(cli).mockResolvedValueOnce(undefined);

    await import('./main.js');

    expect(cli).toHaveBeenCalledWith(process.argv, commands);
    expect(process.exitCode).toBeUndefined();
  });

  it('should handle errors by logging to console.error and setting exit code', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const testError = new Error('Test error');
    vi.mocked(cli).mockRejectedValueOnce(testError);

    await import('./main.js');

    await new Promise(process.nextTick);

    expect(consoleError).toHaveBeenCalledWith(testError);
    expect(process.exitCode).toBe(1);
  });
});
