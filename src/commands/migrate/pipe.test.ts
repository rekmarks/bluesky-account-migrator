import { Readable, Writable } from 'node:stream';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { handlePipe } from './pipe.js';
import {
  makeMockCredentials,
  makeMockCredentialsWithFinalHandle,
} from '../../../test/utils.js';
import { Migration, operations } from '../../migration/index.js';
import type { SerializedMigration } from '../../migration/types.js';

vi.mock('../../migration/operations/index.js', async () => {
  const { makeMockOperations } = await import('../../../test/utils.js');
  return makeMockOperations({
    initializeAgents: vi.fn().mockResolvedValue({
      oldAgent: {},
      newAgent: {},
      accountDid: 'foo',
    }),
  });
});

type Stdin = typeof process.stdin;
type Stdout = typeof process.stdout;

describe('handlePipe', () => {
  let mockStdin: Readable;
  let mockStdout: Writable;
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
  });

  it('runs migration until RequestedPlcOperation when no confirmation token provided', async () => {
    const inputData = {
      state: 'Ready',
      credentials: makeMockCredentials(),
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    await handlePipe();

    expect(JSON.parse(writtenOutput)).toStrictEqual({
      state: 'RequestedPlcOperation',
      credentials: makeMockCredentials(),
    });
  });

  it('runs migration to completion when confirmation token provided', async () => {
    const inputData = {
      state: 'Ready',
      credentials: makeMockCredentials(),
      confirmationToken: 'test-token',
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    const expectedState = 'Finalized';
    const expectedPrivateKey = 'test-private-key';

    vi.mocked(operations.migrateIdentity).mockResolvedValue(expectedPrivateKey);

    await handlePipe();

    expect(JSON.parse(writtenOutput)).toStrictEqual({
      ...inputData,
      state: expectedState,
      newPrivateKey: expectedPrivateKey,
    });
  });

  it('handles partial migration', async () => {
    const inputData = {
      // No state
      credentials: makeMockCredentials(),
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    await handlePipe();

    expect(JSON.parse(writtenOutput)).toStrictEqual({
      state: 'RequestedPlcOperation',
      credentials: makeMockCredentials(),
    });
  });

  it('outputs current state even when migration fails', async () => {
    const inputData: SerializedMigration = {
      credentials: makeMockCredentials(),
      state: 'Ready',
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    vi.mocked(operations.createNewAccount).mockRejectedValue(
      new Error('Migration failed'),
    );

    await expect(handlePipe()).rejects.toThrow('Migration failed');

    expect(JSON.parse(writtenOutput)).toStrictEqual({
      ...inputData,
      state: 'Initialized',
    });
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
    const inputData: SerializedMigration = {
      credentials: makeMockCredentials(),
      state: 'Ready',
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    const unexpectedState = 'Finalized';
    vi.spyOn(Migration.prototype, 'run').mockResolvedValue(unexpectedState);

    await expect(handlePipe()).rejects.toThrow(
      `Fatal: Unexpected migration state "${unexpectedState}" after initial run`,
    );
  });

  it('handles invalid handles', async () => {
    const credentials = makeMockCredentialsWithFinalHandle('bar.baz');
    credentials.newHandle.temporaryHandle = 'kaplar.kaplar';
    const inputData: SerializedMigration = {
      credentials,
      state: 'Ready',
    };

    mockStdin.push(JSON.stringify(inputData));
    mockStdin.push(null);

    await expect(handlePipe()).rejects.toThrow('Invalid migration arguments');
  });
});
