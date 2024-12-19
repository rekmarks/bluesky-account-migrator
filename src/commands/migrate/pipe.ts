import { Migration } from '../../migration/index.js';
import type { MigrationState } from '../../migration/types.js';
import { handleUnknownError, isPlainObject } from '../../utils/index.js';

/**
 * Handles the pipe migration mode.
 */
export async function handlePipe(): Promise<void> {
  const input = await readStdin();

  let rawCredentials: Record<string, unknown>;
  try {
    rawCredentials = JSON.parse(input);
  } catch (error) {
    throw handleUnknownError('Invalid input: must be JSON', error);
  }

  if (!isPlainObject(rawCredentials)) {
    throw new Error('Invalid input: must be a plain JSON object');
  }

  let migration: Migration;
  try {
    migration = await Migration.deserialize(rawCredentials);
  } catch (error) {
    throw handleUnknownError('Invalid migration arguments', error);
  }

  const expectedState: MigrationState =
    migration.confirmationToken === undefined
      ? 'RequestedPlcOperation'
      : 'Finalized';

  try {
    const state = await migration.run();
    if (state !== expectedState) {
      throw new Error(
        `Fatal: Unexpected migration state "${state}" after initial run`,
      );
    }
    writeStdout(migration.serialize());
  } catch (error) {
    writeStdout(migration.serialize());
    throw error;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function writeStdout(data: Record<string, unknown>): void {
  // Plain JSON.stringify() for single-line output
  process.stdout.write(JSON.stringify(data));
}
