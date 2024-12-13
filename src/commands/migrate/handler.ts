import {
  logLine,
  logWarning,
  logWelcome,
  logWrapped,
} from '../../utils/index.js';
import { Migration, MigrationState } from '../../migration/index.js';
import type { MigrationCredentials } from '../../migration/index.js';
import { getCredentialsInteractive, validateString } from './credentials.js';
import { input } from './prompts.js';

export async function handleMigrateInteractive(): Promise<void> {
  logWelcome();
  console.log();
  logWarning(`
    This is a community-maintained tool that has no affiliation with Bluesky.
    Use at your own risk.


    At the end of the migration process, this tool will print the private key of the new account to the console.

    You MUST save this key in a secure location, or you could lose access to your account.
  `);
  console.log();

  const initResult = await initializeMigration();
  if (!initResult) {
    return;
  }

  const { credentials, migration } = initResult;

  console.log();
  console.log(
    `Email challenge requested from old PDS (${credentials.oldPdsUrl}).`,
  );
  console.log(
    `An email should have been sent to the old account's email address.`,
  );
  console.log();

  const confirmationToken = await input({
    message: 'Enter the confirmation token from the challenge email',
    validate: validateString,
  });
  migration.confirmationToken = confirmationToken;

  const privateKey = await finalizeMigration(migration);

  console.log();
  logWrapped('Migration completed successfully! ✅');
  console.log();
  logPrivateKey(privateKey);
  console.log();
  logWarning(
    `You must save this key in a secure location, or you could lose access to your account.`,
  );
  console.log();
  logWrapped('Thank you for using the Bluesky account migration tool 🙇');
}

async function initializeMigration(): Promise<
  | {
      credentials: MigrationCredentials;
      migration: Migration;
    }
  | undefined
> {
  const credentials = await getCredentialsInteractive();
  if (!credentials) {
    return undefined;
  }

  const migration = new Migration({ credentials });
  const result = await migration.run();
  if (result !== MigrationState.RequestedPlcOperation) {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after initial run. Please report this bug.`,
    );
  }

  return { credentials, migration };
}

async function finalizeMigration(migration: Migration): Promise<string> {
  const result = await migration.run();
  if (result !== MigrationState.Finalized) {
    throw new Error(
      `Fatal: Unexpected migration state "${result}" after resuming migration. Please report this bug.`,
    );
  }
  if (!migration.newPrivateKey) {
    throw new Error(
      `Fatal: No private key found after migration. Please report this bug.`,
    );
  }

  return migration.newPrivateKey;
}

function logPrivateKey(privateKey: string): void {
  console.log('Your private key is:');
  logLine('=');
  console.log();
  console.log(privateKey);
  console.log();
  logLine('=');
  console.log();
}
