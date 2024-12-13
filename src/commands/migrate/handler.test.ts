import {
  describe,
  it,
  expect,
  vi,
  Mock,
  beforeEach,
  MockInstance,
} from 'vitest';
import { makeMockCredentials } from '../../../test/utils.js';
import type { MigrationCredentials } from '../../migration/index.js';
import { Migration, MigrationState } from '../../migration/index.js';
import { handleMigrateInteractive } from './handler.js';
import { input } from './prompts.js';

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
  getCredentialsInteractive: vi.fn(() =>
    Promise.resolve(makeMockCredentials()),
  ),
}));

type MockMigration = {
  credentials: MigrationCredentials;
  confirmationToken?: string | undefined;
  newPrivateKey?: string | undefined;
  calls: number;
  run: Mock<() => Promise<MigrationState>> | undefined;
  state: MigrationState;
};

describe('handleMigrateInteractive', () => {
  let mockPrivateKey: string | undefined;
  let logSpy: MockInstance<() => void>;
  const runMock: Mock<() => Promise<MigrationState>> = vi.fn();

  beforeEach(() => {
    mockPrivateKey = undefined;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    vi.mocked(Migration).mockImplementation(function (
      this: MockMigration,
      arg: { credentials: MigrationCredentials },
    ) {
      this.credentials = arg.credentials;
      this.newPrivateKey = mockPrivateKey;
      this.run = runMock;
      this.state = MigrationState.Ready;
      return this as unknown as Migration;
    });
  });

  it('should run a migration', async () => {
    const mockToken = 'bar';
    vi.mocked(input).mockResolvedValue(mockToken);

    mockPrivateKey = '0xdeadbeef';
    runMock
      .mockResolvedValueOnce(MigrationState.RequestedPlcOperation)
      .mockResolvedValueOnce(MigrationState.Finalized);

    await handleMigrateInteractive();

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
    runMock.mockRejectedValueOnce(new Error('foo'));

    await expect(handleMigrateInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Migration failed during state "Ready"'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('The migration has created a new account'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`The new account's private key is:`),
    );
  });

  it('should handle a failed migration in the CreatedNewAccount state', async () => {
    runMock.mockImplementation(function (this: MockMigration) {
      this.state = MigrationState.CreatedNewAccount;
      return Promise.reject(new Error('foo'));
    });

    await expect(handleMigrateInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Migration failed during state "CreatedNewAccount"',
      ),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('The migration has created a new account'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(`The new account's private key is:`),
    );
  });

  it('should handle a failed migration in the MigratedIdentity state', async () => {
    mockPrivateKey = '0xdeadbeef';
    runMock.mockImplementation(function (this: MockMigration) {
      this.state = MigrationState.MigratedIdentity;
      return Promise.reject(new Error('foo'));
    });

    await expect(handleMigrateInteractive()).rejects.toThrow(new Error('foo'));

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Migration failed during state "MigratedIdentity"',
      ),
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
