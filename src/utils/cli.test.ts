import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';

import type { BaseArgv } from './cli.js';
import { makeHandler } from './cli.js';

const makeArgv = (debug: boolean): BaseArgv => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return { debug, _: [], $0: '' };
};

describe('makeHandler', () => {
  let originalProcess: typeof process;
  let mockConsoleError: ReturnType<typeof vi.spyOn>;
  let mockProcessExitCode: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    originalProcess = globalThis.process;
    // @ts-expect-error Yeah, you're not supposed to do this.
    globalThis.process = {
      exitCode: undefined,
    };
  });

  afterAll(() => {
    globalThis.process = originalProcess;
  });

  beforeEach(() => {
    mockConsoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockProcessExitCode = vi.spyOn(process, 'exitCode', 'set');
  });

  it('passes through successful execution', async () => {
    const mockFn = vi.fn();
    const handler = makeHandler(mockFn);
    const argv = makeArgv(false);

    await handler(argv);

    expect(mockFn).toHaveBeenCalledOnce();
    expect(mockFn).toHaveBeenCalledWith(argv);
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockProcessExitCode).not.toHaveBeenCalled();
  });

  it('handles errors with debug=false', async () => {
    const error = new Error('test error');
    const mockFn = vi.fn().mockRejectedValue(error);
    const handler = makeHandler(mockFn);
    const argv = makeArgv(false);

    await handler(argv);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: test error');
    expect(mockProcessExitCode).toHaveBeenCalledWith(1);
  });

  it('handles errors with debug=true', async () => {
    const error = new Error('test error');
    error.stack = ' test error\n    at test';
    const mockFn = vi.fn().mockRejectedValue(error);
    const handler = makeHandler(mockFn);
    const argv = makeArgv(true);

    await handler(argv);

    expect(mockConsoleError).toHaveBeenCalledWith(error);
    expect(error.message).toBe('Error: test error');
    expect(mockProcessExitCode).toHaveBeenCalledWith(1);
  });

  it('converts non-Error thrown values into errors', async () => {
    const mockFn = vi.fn().mockRejectedValue('string error');
    const handler = makeHandler(mockFn);
    const argv = makeArgv(false);

    await handler(argv);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: string error');
    expect(mockProcessExitCode).toHaveBeenCalledWith(1);
  });

  it('handles synchronous handlers', async () => {
    const mockFn = vi.fn();
    const handler = makeHandler(mockFn);
    const argv = makeArgv(false);

    await handler(argv);

    expect(mockFn).toHaveBeenCalledOnce();
    expect(mockFn).toHaveBeenCalledWith(argv);
    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(mockProcessExitCode).not.toHaveBeenCalled();
  });

  it('handles synchronous errors', async () => {
    const error = new Error('sync error');
    const mockFn = vi.fn().mockImplementation(() => {
      throw error;
    });
    const handler = makeHandler(mockFn);
    const argv = makeArgv(false);

    await handler(argv);

    expect(mockConsoleError).toHaveBeenCalledWith('Error: sync error');
    expect(mockProcessExitCode).toHaveBeenCalledWith(1);
  });
});
