import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { makeMockCredentials } from '../../../test/utils.js';
import type { MigrationCredentials } from '../../migration/index.js';
import { Migration, MigrationState } from '../../migration/index.js';
import { handleMigrateInteractive } from './handler.js';
import { input } from './prompts.js';

vi.mock('./prompts.js', () => ({
  input: vi.fn(),
}));

type MockMigration = {
  credentials: MigrationCredentials;
  confirmationToken?: string | undefined;
  newPrivateKey?: string | undefined;
  calls: number;
  run: Mock<() => Promise<MigrationState>> | undefined;
};

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

describe('handleMigrateInteractive', () => {
  let mockPrivateKey: string | undefined;
  const runMock: Mock<() => Promise<MigrationState>> = vi.fn();

  beforeEach(() => {
    mockPrivateKey = undefined;

    vi.mocked(Migration).mockImplementation(function (
      this: MockMigration,
      arg: { credentials: MigrationCredentials },
    ) {
      this.credentials = arg.credentials;
      this.newPrivateKey = mockPrivateKey;
      this.run = runMock;
      return this as unknown as Migration;
    });
  });

  it('should run a migration', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const mockToken = 'bar';
    vi.mocked(input).mockResolvedValue(mockToken);

    mockPrivateKey = 'foo';
    runMock
      .mockResolvedValueOnce(MigrationState.MigratedData)
      .mockResolvedValueOnce(MigrationState.Finalized);

    await handleMigrateInteractive();

    expect(vi.mocked(Migration).mock.instances[0]?.confirmationToken).toBe(
      mockToken,
    );
    expect(logSpy).toHaveBeenCalledWith(
      '🦋 Welcome to the Bluesky account migration tool 🦋',
    );
    expect(logSpy).toHaveBeenCalledWith(
      `Your private key is:\n${mockPrivateKey}\n`,
    );
    expect(logSpy).toHaveBeenCalledWith(
      `Thank you for using the Bluesky account migration tool 🙇`,
    );
  });
});
