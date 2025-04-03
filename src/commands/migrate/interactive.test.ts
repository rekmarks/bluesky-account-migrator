import type { Mock, MockInstance } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { handleInteractive } from './interactive.js';
import { input } from './prompts.js';
import { makeMockCredentials } from '../../../test/utils.js';
import type { MockMigration } from '../../../test/utils.js';
import type {
  MigrationCredentials,
  MigrationState,
} from '../../migration/index.js';
import { Migration } from '../../migration/index.js';
import { consume } from '../../utils/misc.js';

vi.mock('../../utils/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  logCentered: (message: string) => console.log(message),
  logWrapped: (message: string) => console.log(message),
  logError: (message: string) => console.log(message),
}));

vi.mock('./prompts.js', () => ({
  input: vi.fn(),
  pressEnter: vi.fn(),
}));

vi.mock('../../migration/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  Migration: vi.fn(),
}));

vi.mock('./credentials.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCredentialsInteractive: vi.fn(async () =>
    Promise.resolve(makeMockCredentials()),
  ),
}));

describe('handleMigrateInteractive', () => {
  let mockPrivateKey: string | undefined;
  let logSpy: MockInstance<() => void>;
  const runMock: Mock<() => AsyncGenerator<MigrationState>> = vi.fn();

  beforeEach(() => {
    mockPrivateKey = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    /* eslint-disable no-invalid-this */
    vi.mocked(Migration).mockImplementation(function (
      this: MockMigration,
      arg: { credentials: MigrationCredentials },
    ) {
      this.credentials = arg.credentials;
      this.newPrivateKey = mockPrivateKey;
      this.runIter = runMock;
      // eslint-disable-next-line vitest/prefer-spy-on
      this.run = vi.fn(async () => consume(this.runIter()));
      this.state = 'Ready';
      return this as unknown as Migration;
    });
    /* eslint-enable no-invalid-this */
  });

  it('should run a migration', async () => {
    const mockToken = 'bar';
    vi.mocked(input).mockResolvedValue(mockToken);

    mockPrivateKey = '0xdeadbeef';
    runMock
      .mockImplementationOnce(async function* () {
        yield 'RequestedPlcOperation';
      })
      .mockImplementationOnce(async function* () {
        yield 'Finalized';
      });

    await handleInteractive();

    expect(vi.mocked(Migration).mock.instances[0]?.confirmationToken).toBe(
      mockToken,
    );
    expect(vi.mocked(Migration).mock.instances[0]?.newPrivateKey).toBe(
      mockPrivateKey,
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migration completed successfully! ✅'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(mockPrivateKey),
    );
    expect.stringContaining(
      'Thank you for using the Bluesky account migration tool 🙇',
    );
  });

  it('should handle a failed migration in the Ready state', async () => {
    const state = 'Ready';
    runMock.mockImplementation(async function* (this: MockMigration) {
      // eslint-disable-next-line no-invalid-this
      this.state = state;
      throw new Error('foo');
      yield state;
    });

    await expect(handleInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Migration failed during state "${state}"`),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('The migration has created a new account'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`The new account's private key is:`),
    );
  });

  it('should handle a failed migration in the CreatedNewAccount state', async () => {
    const state = 'CreatedNewAccount';
    runMock.mockImplementation(async function* (this: MockMigration) {
      // eslint-disable-next-line no-invalid-this
      this.state = state;
      throw new Error('foo');
      yield state;
    });

    await expect(handleInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Migration failed during state "${state}"`),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('The migration has created a new account'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`The new account's private key is:`),
    );
  });

  it('should handle a failed migration in the MigratedIdentity state', async () => {
    const state = 'MigratedIdentity';
    mockPrivateKey = '0xdeadbeef';
    runMock.mockImplementation(async function* (this: MockMigration) {
      // eslint-disable-next-line no-invalid-this
      this.state = state;
      throw new Error('foo');
      yield state;
    });

    await expect(handleInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Migration failed during state "${state}"`),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('The migration has created a new account'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(`The new account's private key is:`),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(mockPrivateKey),
    );
  });
});
