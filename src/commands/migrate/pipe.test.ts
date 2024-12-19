import { Readable, Writable } from 'node:stream';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { handlePipe } from './pipe.js';
import { makeMockCredentials } from '../../../test/utils.js';
import type { MockMigration } from '../../../test/utils.js';
import { Migration } from '../../migration/index.js';
import type { SerializedMigration } from '../../migration/types.js';

vi.mock('../../migration/index.js', () => ({
  Migration: {
    deserialize: vi.fn(),
  },
}));

type Stdin = typeof process.stdin;
type Stdout = typeof process.stdout;

describe('handlePipe', () => {
  let mockStdin: Readable;
  let mockStdout: Writable;
  let mockMigration: MockMigration;
  let mockSerializedMigration: SerializedMigration;
  let writtenOutput: string;

  beforeEach(() => {
    writtenOutput = '';

    mockStdin = new Readable();
    vi.spyOn(mockStdin, '_read').mockImplementation(() => undefined);
    vi.spyOn(process, 'stdin', 'get').mockReturnValue(mockStdin as Stdin);

    mockStdout = new Writable();
    vi.spyOn(mockStdout, '_write').mockImplementation(
      (chunk: Buffer | string, _encoding, callback) => {
        writtenOutput += chunk.toString();
        callback();
      },
    );
    vi.spyOn(process, 'stdout', 'get').mockReturnValue(mockStdout as Stdout);

    mockMigration = {
      run: vi.fn(),
      serialize: vi.fn(),
      deserialize: vi.fn(),
      state: 'Ready',
      confirmationToken: undefined,
      newPrivateKey: undefined,
      credentials: makeMockCredentials(),
    };

    mockSerializedMigration = {
      state: 'Ready',
      credentials: makeMockCredentials(),
    };

    vi.mocked(Migration.deserialize).mockResolvedValue(
      mockMigration as unknown as Migration,
    );
  });

  it('runs migration until RequestedPlcOperation when no confirmation token provided', async () => {
    const expectedState = 'RequestedPlcOperation';
    vi.mocked(mockMigration.run).mockResolvedValue(expectedState);

    const serializedResult: SerializedMigration = {
      ...mockSerializedMigration,
      state: expectedState,
    };
    vi.mocked(mockMigration.serialize).mockReturnValue(serializedResult);

    mockStdin.push(JSON.stringify(mockSerializedMigration));
    mockStdin.push(null);

    await handlePipe();

    expect(Migration.deserialize).toHaveBeenCalledOnce();
    expect(Migration.deserialize).toHaveBeenCalledWith(mockSerializedMigration);

    expect(mockMigration.run).toHaveBeenCalledOnce();

    expect(writtenOutput).toBe(JSON.stringify(serializedResult));
  });

  it('runs migration to completion when confirmation token provided', async () => {
    const inputData = {
      ...mockSerializedMigration,
      confirmationToken: 'test-token',
    };
    const expectedState = 'Finalized';
    const expectedPrivateKey = 'test-private-key';

    mockMigration.confirmationToken = 'test-token';
    mockMigration.newPrivateKey = expectedPrivateKey;
    vi.mocked(mockMigration.run).mockResolvedValue(expectedState);

    const serializedResult: SerializedMigration = {
      ...inputData,
      state: expectedState,
      newPrivateKey: expectedPrivateKey,
    };
    vi.mocked(mockMigration.serialize).mockReturnValue(serializedResult);

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    await handlePipe();

    expect(Migration.deserialize).toHaveBeenCalledOnce();
    expect(Migration.deserialize).toHaveBeenCalledWith(inputData);

    expect(mockMigration.run).toHaveBeenCalledOnce();

    expect(writtenOutput).toBe(JSON.stringify(serializedResult));
  });

  it('outputs current state even when migration fails', async () => {
    vi.mocked(mockMigration.run).mockRejectedValue(
      new Error('Migration failed'),
    );

    const serializedResult: SerializedMigration = {
      ...mockSerializedMigration,
      state: 'Ready',
    };
    vi.mocked(mockMigration.serialize).mockReturnValue(serializedResult);

    mockStdin.push(JSON.stringify(mockSerializedMigration));
    mockStdin.push(null);

    await expect(handlePipe()).rejects.toThrow('Migration failed');

    expect(writtenOutput).toBe(JSON.stringify(serializedResult));
  });

  it('handles invalid JSON input', async () => {
    mockStdin.push('invalid json');
    mockStdin.push(null);

    await expect(handlePipe()).rejects.toThrow('Invalid input: must be JSON');
  });

  it('handles non-object JSON input', async () => {
    mockStdin.push('"string input"');
    mockStdin.push(null);

    await expect(handlePipe()).rejects.toThrow(
      'Invalid input: must be a plain JSON object',
    );
  });

  it('handles unexpected migration state', async () => {
    const unexpectedState = 'Initialized';
    vi.mocked(mockMigration.run).mockResolvedValue(unexpectedState);
    vi.mocked(mockMigration.serialize).mockReturnValue({
      ...mockSerializedMigration,
      state: unexpectedState,
    });

    mockStdin.push(JSON.stringify(mockSerializedMigration));
    mockStdin.push(null);

    await expect(handlePipe()).rejects.toThrow(
      `Fatal: Unexpected migration state "${unexpectedState}" after initial run`,
    );
  });
});
